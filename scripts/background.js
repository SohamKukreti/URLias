browser.omnibox.setDefaultSuggestion({ description: "Navigate to a site using an alias." });
import { BUILTIN_SEARCH_TPL } from "./builtIns.js";

async function handleAlias(parts, disposition, aliases, searchTrigger){
  // console.log("handleAlias triggered for alias:", parts[0], "with query:", parts.slice(1).join(" "));
  if(!searchTrigger) {
    searchTrigger = "search";
  }

  const aliasKey = parts[0];
  let extraQuery = "";
  let targetUrl = null;
  // console.log(parts)
  if (parts.length > 1 && parts[1] === searchTrigger) {
    // console.log("Search triggered for alias:", aliasKey, "with query:", parts.slice(2).join(" "));
    targetUrl = buildSearchUrl(aliases[aliasKey], parts.slice(2).join(" "));
    // console.log("Built search URL:", targetUrl);
  } 
  else {
    for (let i = 1; i < parts.length; i++) {
      const part = encodeURIComponent(parts[i]);
      extraQuery += part + "/";
    }
    // console.log("aliasKey: ", aliasKey)
    // console.log(parts)
    // console.log(extraQuery)
    targetUrl = aliases[aliasKey]
    
    // let targetUrl = aliases[input.trim()]; // Use trimmed input

    if (targetUrl) {
        if (extraQuery) {
          targetUrl = targetUrl.replace(/\/+$/, "");
          targetUrl += "/" + extraQuery;
        }
      // Alias found, normalize the stored URL
      targetUrl = normalizeUrl(targetUrl);
    }

    // If no alias matched OR normalization failed, perform a default search
    if (!targetUrl) {
      targetUrl = `https://www.google.com/search?q=${encodeURIComponent(aliasKey)}`;
    }
  }

  // Open the URL based on disposition
  try {
    switch (disposition) {
      case "currentTab":
        // Get the current active tab in the current window
        let [currentTab] = await browser.tabs.query({ active: true, currentWindow: true });
        if (currentTab?.id) {
            await browser.tabs.update(currentTab.id, { url: targetUrl });
        } else {
            // Fallback if no active tab found (edge case)
            await browser.tabs.create({ url: targetUrl });
        }
        break;
      case "newForegroundTab":
        await browser.tabs.create({ url: targetUrl, active: true });
        break;
      case "newBackgroundTab":
        await browser.tabs.create({ url: targetUrl, active: false });
        break;
      default:
        // Fallback for unexpected disposition values
        await browser.tabs.create({ url: targetUrl });
        break;
    }
  } catch (error) {
      console.error(`Error handling omnibox input "${input}" with URL "${targetUrl}":`, error);
      // Optionally provide user feedback here if possible/needed
  }
}

/* ---------- url helpers ---------- */

function normalizeUrl(url) {
  if (!url) return null; // Handle potentially empty URLs
  try {
    // Check if it already has a protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      // Try adding https:// first
      new URL(`https://${url}`);
      return `https://${url}`;
    }
    // If it already has a protocol or adding https failed but http might work (less common)
    new URL(url);
    return url;
  } catch (e) {
     console.warn(`Could not normalize URL "${url}". Falling back to search.`);
     // If normalization fails completely, return null to indicate failure
     return null;
  }
}

async function handleCollection(collection, aliases){
  const websites = collection.split(",");
  // console.log("websites: ", websites)
  // open each website in a new tab
  for (const website of websites){
    const parts = website.split(" ");
    await handleAlias(parts, "newBackgroundTab", aliases);
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
  const tpl =
    templateFor(homeUrl) ||
    `https://www.google.com/search?q=site:${encodeURIComponent(
      new URL(homeUrl).hostname
    )}+%s`;
  // console.log(tpl)
  return tpl.replace("%s", encodeURIComponent(query.trim()));
}


/* ---------- main omnibox handler ---------- */

// Cache storage data
let cachedAliases = null;
let cachedCollections = null;
let cachedSearchTrigger = null;

async function getCachedData() {
  if (!cachedAliases || !cachedCollections || !cachedSearchTrigger) {
    const data = await browser.storage.sync.get(["aliases", "collections", "searchTrigger"]);
    cachedAliases = data.aliases || {};
    cachedCollections = data.collections || {};
    cachedSearchTrigger = data.searchTrigger || "search";
  }
  return { aliases: cachedAliases, collections: cachedCollections, searchTrigger: cachedSearchTrigger };
}

browser.omnibox.onInputEntered.addListener(async (input, disposition) => {
  if (!input) return;
  
  const { aliases, collections, searchTrigger } = await getCachedData();
  if(!searchTrigger){
    searchTrigger = "search";
  }
  const parts = input.trim().split(/\s+/);
  const aliasKey = parts[0];
  // first check if it is a normal alias and then check if it is a collection
  if(aliases[aliasKey]){
    await handleAlias(parts, disposition, aliases, searchTrigger);
  } else if (collections[aliasKey]) {
    await handleCollection(collections[aliasKey], aliases);
  } else {
    // if it is not a normal alias or a collection, then it is a search
    await handleAlias(parts, disposition, aliases, searchTrigger);
  }
});