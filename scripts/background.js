import { BUILTIN_SEARCH_TPL } from "./builtIns.js";

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

chrome.omnibox.onInputEntered.addListener((text) => {
  chrome.windows.getCurrent((currentWindow) => {
    const windowId = currentWindow.id;
    chrome.storage.sync.get(["aliases", "searchTrigger", "collections"], (data) => {
      const aliases = data.aliases || {};
      const searchTrigger = data.searchTrigger || "search";
      const collections = data.collections || {};
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
  });
});