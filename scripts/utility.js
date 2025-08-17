import { BUILTIN_SEARCH_TPL } from "./builtIns.js";

/* ---------- performance optimizations ---------- */

// Cache for storage data to reduce API calls
let storageCache = {
    aliases: {},
    collections: {},
    aliasUsage: {},
    searchTrigger: "search",
    lastUpdated: 0
  };
  
  // Cache expiration time (5 minutes)
  const CACHE_EXPIRY = 5 * 60 * 1000;
    
  // Load storage data with caching
  export async function loadStorageData() {
    const now = Date.now();
    
    // Return cached data if still valid
    if (now - storageCache.lastUpdated < CACHE_EXPIRY) {
      return storageCache;
    }
    
    try {
      const data = await chrome.storage.sync.get([
        "aliases", 
        "collections", 
        "aliasUsage", 
        "searchTrigger"
      ]);
      
      // Update cache
      storageCache = {
        aliases: data.aliases || {},
        collections: data.collections || {},
        aliasUsage: data.aliasUsage || {},
        searchTrigger: data.searchTrigger || "search",
        lastUpdated: now
      };
      
      return storageCache;
    } catch (error) {
      console.error("Error loading storage data:", error);
      return storageCache; // Return stale cache on error
    }
  }
  
  // Invalidate cache when storage changes
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.aliases || changes.collections || changes.aliasUsage || changes.searchTrigger) {
      storageCache.lastUpdated = 0; // Force cache refresh
    }
  });
  
/* ---------- usage tracking ---------- */

export async function incrementAliasUsage(aliasName) {
    try {
      // Update cache immediately for better UX
      storageCache.aliasUsage[aliasName] = (storageCache.aliasUsage[aliasName] || 0) + 1;
      
      // Save to storage asynchronously (don't await)
      chrome.storage.sync.get("aliasUsage", (data) => {
        const usage = data.aliasUsage || {};
        usage[aliasName] = storageCache.aliasUsage[aliasName];
        chrome.storage.sync.set({ aliasUsage: usage });
      });
    } catch (error) {
      console.error("Error incrementing alias usage:", error);
    }
  }
  
  /* ---------- alias handling ---------- */

  export function getMostFrequentlyUsedAliases(aliases, usage, limit = 5) {
    // Create array of aliases with their usage counts
    const aliasesWithUsage = Object.keys(aliases).map(alias => ({
      name: alias,
      url: aliases[alias],
      usage: usage[alias] || 0
    }));
    
    // Sort by usage count (descending) and return top aliases
    return aliasesWithUsage
      .sort((a, b) => b.usage - a.usage)
      .slice(0, limit);
  }
  
  // Pre-compute sorted aliases for better performance
  let sortedAliasesCache = [];
  let lastSortTime = 0;
  
  export function getSortedAliases(aliases, usage) {
    const now = Date.now();
    
    // Return cached sorted aliases if recent
    if (now - lastSortTime < 1000 && sortedAliasesCache.length > 0) {
      return sortedAliasesCache;
    }
    
    // Create and sort aliases
    sortedAliasesCache = Object.entries(aliases).map(([alias, url]) => ({
      alias,
      url,
      usage: usage[alias] || 0
    })).sort((a, b) => b.usage - a.usage);
    
    lastSortTime = now;
    return sortedAliasesCache;
  }
  
  export async function handleAlias(text, aliases, searchTrigger, keepCurrentTab = true, windowId = null) {
    const parts = text.trim().split(/\s+/);
    const aliasKey = parts[0];
  
    let url = aliases[aliasKey];
    let extraQuery = "";
    if (url) {
      // Track usage when alias is found and used (non-blocking)
      incrementAliasUsage(aliasKey);
  
      if(parts.length > 1 && parts[1] === searchTrigger) {
        url = buildSearchUrl(aliases[aliasKey], parts.slice(2).join(" "));
      }
  
      else{
        for(let i = 1; i < parts.length; i++) {
          const part = parts[i];
          extraQuery += encodeURIComponent(part) + "/";
        }
        if (extraQuery) {
          url = url.replace(/\/+$/, "");
          url += "/" + extraQuery;
        }
      }
    } 
    
    else {
      url = `https://www.google.com/search?q=${encodeURIComponent(text)}`;
    }
  
    url = normalizeUrl(url);
  
    if (keepCurrentTab) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentTab = tabs[0];
        if (currentTab && currentTab.id) {
          chrome.tabs.update(currentTab.id, { url });
        } else {
          chrome.tabs.create({ url });
        }
      });
    } else {
      // Always open a new background tab in the correct window
      const createProps = { url, active: false };
      if (windowId !== null) createProps.windowId = windowId;
      chrome.tabs.create(createProps);
    }
  }
  
  /* ---------- url normalization ---------- */
  
  export function normalizeUrl(url) {
    try {
      new URL(url);
      return url;
    } catch (e) {
      return `https://${url}`;
    }
  }
  
  export async function handleCollection(collection, aliases, searchTrigger, windowId) {
    const websites = collection.split(",");
    // open each website in a new tab
    for (const website of websites){
      await handleAlias(website, aliases, searchTrigger, false, windowId);
    }
  }
  
  /* ---------- search helpers ---------- */
  
  export function hostnameChain(host) {
    const chain = [];
    let h = host;
    while (h) {
      chain.push(h);
      const dot = h.indexOf(".");
      if (dot === -1) break;
      h = h.slice(dot + 1);            // peel one sub-domain level
    }
    return chain;
  }
  
  export function templateFor(url) {
    url = normalizeUrl(url)
    let host;
    try {
      host = new URL(url).hostname.replace(/^www\./, "");
    } catch (error){
      return null;
    }
    for (const h of hostnameChain(host)) {
      if (BUILTIN_SEARCH_TPL[h]) return BUILTIN_SEARCH_TPL[h];
    }
    return null;
  }
  
  export function buildSearchUrl(homeUrl, query) {
    if (!query) return normalizeUrl(homeUrl);          // just open alias
    homeUrl = normalizeUrl(homeUrl)
    const tpl =
      templateFor(homeUrl) ||
      `https://www.google.com/search?q=site:${encodeURIComponent(
        new URL(homeUrl).hostname
      )}+%s`;
    return tpl.replace("%s", encodeURIComponent(query.trim()));
  }
  