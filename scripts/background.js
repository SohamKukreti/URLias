browser.omnibox.setDefaultSuggestion({ description: "Navigate to a site using an alias." });
import { BUILTIN_SEARCH_TPL } from "./builtIns.js";

/* ---------- alias helpers ---------- */

async function getAliases() {
  try {
    // browser.storage.sync.get returns a Promise in Firefox
    const data = await browser.storage.sync.get("aliases");
    return data.aliases || {}; // Return the aliases object or an empty object if not found
  } catch (error) {
    console.error("Error retrieving aliases:", error);
    return {}; // Return empty object on error
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

/* ---------- search helpers ---------- */

function hostnameChain(host) {
  console.log(host)
  const chain = [];
  let h = host;
  console.log(h)
  while (h) {
    chain.push(h);
    const dot = h.indexOf(".");
    if (dot === -1) break;
    h = h.slice(dot + 1);            // peel one sub-domain level
  }
  return chain;
}

function templateFor(url) {
  console.log("url in templateFor: ", url)
  url = normalizeUrl(url)
  let host;
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
    console.log("host in templateFor: ", host)
  } catch (error){
    console.log("error in templateFor: ", error)
    return null;
  }
  console.log(host)
  for (const h of hostnameChain(host)) {
    if (BUILTIN_SEARCH_TPL[h]) return BUILTIN_SEARCH_TPL[h];
  }
  return null;
}

function buildSearchUrl(homeUrl, query) {
  if (!query) return normalizeUrl(homeUrl);          // just open alias
  console.log("homeUrl: ", homeUrl)
  const tpl =
    templateFor(homeUrl) ||
    `https://www.google.com/search?q=site:${encodeURIComponent(
      new URL(homeUrl).hostname
    )}+%s`;
  console.log(tpl)
  return tpl.replace("%s", encodeURIComponent(query.trim()));
}

browser.omnibox.onInputEntered.addListener(async (input, disposition) => {
  if (!input) return; // Ignore empty input

  let {searchTrigger} = await browser.storage.sync.get("searchTrigger");
  if(!searchTrigger) {
    searchTrigger = "search";
  }

  const aliases = await getAliases();
  const parts = input.trim().split(/\s+/);
  const aliasKey = parts[0];
  let extraQuery = "";
  let targetUrl = null;
  console.log(parts)
  if (parts.length > 1 && parts[1] === searchTrigger) {
    console.log("Search triggered for alias:", aliasKey, "with query:", parts.slice(2).join(" "));
    targetUrl = buildSearchUrl(aliases[aliasKey], parts.slice(2).join(" "));
    console.log("Built search URL:", targetUrl);
  } 
  else {
    for (let i = 1; i < parts.length; i++) {
      const part = encodeURIComponent(parts[i]);
      extraQuery += part + "/";
    }
    console.log(input)
    console.log(parts)
    console.log(extraQuery)
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
      targetUrl = `https://www.google.com/search?q=${encodeURIComponent(input.trim())}`;
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
});