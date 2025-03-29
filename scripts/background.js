chrome.omnibox.onInputEntered.addListener((text) => {
  chrome.storage.sync.get("aliases", (data) => {
    const aliases = data.aliases || {};
    let url = aliases[text] || `https://www.google.com/search?q=${text}`;
    
    url = normalizeUrl(url);

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0];
      if (currentTab && currentTab.id) {
        chrome.tabs.update(currentTab.id, { url });
      }
    });
  });
});

function normalizeUrl(url) {
  try {
    new URL(url);
    return url;
  } catch (e) {
    return `https://${url}`;
  }
}