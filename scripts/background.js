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

// Debounce function for omnibox suggestions
let suggestionTimeout = null;
const SUGGESTION_DELAY = 150; // milliseconds

// Load storage data with caching
async function loadStorageData() {
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

async function incrementAliasUsage(aliasName) {
  try {
    // Update cache immediately for better UX
    storageCache.aliasUsage[aliasName] = (storageCache.aliasUsage[aliasName] || 0) + 1;
    
    // Save to storage asynchronously (don't await)
    chrome.storage.sync.get("aliasUsage", (data) => {
      const usage = data.aliasUsage || {};
      usage[aliasName] = storageCache.aliasUsage[aliasName];
      chrome.storage.sync.set({ aliasUsage: usage });
    });
    
    console.log(`Usage incremented for ${aliasName}: ${storageCache.aliasUsage[aliasName]}`);
  } catch (error) {
    console.error("Error incrementing alias usage:", error);
  }
}

function getMostFrequentlyUsedAliases(aliases, usage, limit = 5) {
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

function getSortedAliases(aliases, usage) {
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

/* ---------- alias handler ---------- */

async function handleAlias(text, aliases, searchTrigger, keepCurrentTab = true, windowId = null) {
  const parts = text.trim().split(/\s+/);
  const aliasKey = parts[0];

  console.log(text)
  console.log(parts)
  console.log(aliases)
  console.log(searchTrigger)
  console.log(keepCurrentTab)

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

function normalizeUrl(url) {
  try {
    new URL(url);
    return url;
  } catch (e) {
    return `https://${url}`;
  }
}

async function handleCollection(collection, aliases, searchTrigger, windowId) {
  const websites = collection.split(",");
  // console.log("websites: ", websites)
  // open each website in a new tab
  for (const website of websites){
    await handleAlias(website, aliases, searchTrigger, false, windowId);
  }
}

/* ---------- search helpers ---------- */

function hostnameChain(host) {
  // console.log(host)
  const chain = [];
  let h = host;
  // console.log(h)
  while (h) {
    chain.push(h);
    const dot = h.indexOf(".");
    if (dot === -1) break;
    h = h.slice(dot + 1);            // peel one sub-domain level
  }
  return chain;
}

function templateFor(url) {
  // console.log("url in templateFor: ", url)
  url = normalizeUrl(url)
  let host;
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
    // console.log("host in templateFor: ", host)
  } catch (error){
    // console.log("error in templateFor: ", error)
    return null;
  }
  // console.log(host)
  for (const h of hostnameChain(host)) {
    if (BUILTIN_SEARCH_TPL[h]) return BUILTIN_SEARCH_TPL[h];
  }
  return null;
}

function buildSearchUrl(homeUrl, query) {
  if (!query) return normalizeUrl(homeUrl);          // just open alias
  // console.log("homeUrl: ", homeUrl)
  homeUrl = normalizeUrl(homeUrl)
  const tpl =
    templateFor(homeUrl) ||
    `https://www.google.com/search?q=site:${encodeURIComponent(
      new URL(homeUrl).hostname
    )}+%s`;
  // console.log(tpl)
  return tpl.replace("%s", encodeURIComponent(query.trim()));
}



/* ---------- entry point for the extension ---------- */

// Handle omnibox suggestions

chrome.omnibox.onInputChanged.addListener((text, suggest) => {
  // Clear previous timeout
  if (suggestionTimeout) {
    clearTimeout(suggestionTimeout);
  }
  
  // Debounce suggestions to reduce processing
  suggestionTimeout = setTimeout(async () => {
    try {
      const { aliases, collections, aliasUsage } = await loadStorageData();
      
      const suggestions = [];
      const searchTerm = text.toLowerCase().trim();
      
      if (searchTerm === "") {
        // When user types "go" (empty search term), show most frequently used aliases first
        const mostUsedAliases = getMostFrequentlyUsedAliases(aliases, aliasUsage, 5);
        
        // Add most frequently used aliases first
        for (const aliasData of mostUsedAliases) {
          suggestions.push({
            content: `${aliasData.name}`,
            description: `${aliasData.name} → ${aliasData.url} (used ${aliasData.usage} times)`
          });
        }
        
        // Add remaining aliases
        for (const [alias, url] of Object.entries(aliases)) {
          if (!mostUsedAliases.find(a => a.name === alias)) {
            suggestions.push({
              content: `${alias}`,
              description: `${alias} → ${url}`
            });
          }
        }
        
        // Add collections
        for (const [collectionName, aliasesStr] of Object.entries(collections)) {
          const aliasList = aliasesStr.split(',').slice(0, 3).join(', ');
          const moreText = aliasesStr.split(',').length > 3 ? '...' : '';
          suggestions.push({
            content: `${collectionName}`,
            description: `Collection: ${collectionName} (${aliasList}${moreText})`
          });
        }
      } else {
        // When user types something, show matching aliases and collections
        // Use pre-computed sorted aliases for better performance
        const sortedAliases = getSortedAliases(aliases, aliasUsage);
        
        for (const { alias, url, usage: usageCount } of sortedAliases) {
          if (alias.toLowerCase().includes(searchTerm)) {
            const description = usageCount > 0 
              ? `${alias} → ${url} (used ${usageCount} times)`
              : `${alias} → ${url}`;
            
            suggestions.push({
              content: `${alias}`,
              description: description
            });
          }
        }
        
        for (const [collectionName, aliasesStr] of Object.entries(collections)) {
          if (collectionName.toLowerCase().includes(searchTerm)) {
            const aliasList = aliasesStr.split(',').slice(0, 3).join(', ');
            const moreText = aliasesStr.split(',').length > 3 ? '...' : '';
            suggestions.push({
              content: `${collectionName}`,
              description: `Collection: ${collectionName} (${aliasList}${moreText})`
            });
          }
        }
      }
      
      // Limit suggestions to 10 items
      suggest(suggestions.slice(0, 10));
    } catch (error) {
      console.error("Error generating suggestions:", error);
      suggest([]);
    }
  }, SUGGESTION_DELAY);
});

chrome.omnibox.onInputEntered.addListener(async (text) => {
  try {
    const { aliases, searchTrigger, collections } = await loadStorageData();
    
    chrome.windows.getCurrent((currentWindow) => {
      const windowId = currentWindow.id;
      const parts = text.trim().split(/\s+/);
      const aliasKey = parts[0];
      
      if (aliases[aliasKey]) {
        handleAlias(text, aliases, searchTrigger, true, windowId);
      } else if (collections[aliasKey]) {
        handleCollection(collections[aliasKey], aliases, searchTrigger, windowId);
      } else {
        handleAlias(text, aliases, searchTrigger, true, windowId);
      }
    });
  } catch (error) {
    console.error("Error handling omnibox input:", error);
  }
});