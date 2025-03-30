browser.omnibox.setDefaultSuggestion({ description: "Navigate to a site using an alias." });

// Updated getAliases to directly use the Promise returned by browser.storage.sync.get
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

function normalizeUrl(url) {
  // No changes needed here, it's standard JavaScript
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

browser.omnibox.onInputEntered.addListener(async (input, disposition) => {
  if (!input) return; // Ignore empty input

  const aliases = await getAliases();
  let targetUrl = aliases[input.trim()]; // Use trimmed input

  if (targetUrl) {
    // Alias found, normalize the stored URL
    targetUrl = normalizeUrl(targetUrl);
  }

  // If no alias matched OR normalization failed, perform a default search
  if (!targetUrl) {
    targetUrl = `https://www.google.com/search?q=${encodeURIComponent(input.trim())}`;
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