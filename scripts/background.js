chrome.omnibox.onInputEntered.addListener((text) => {
  chrome.storage.sync.get("aliases", (data) => {
    const aliases = data.aliases || {};
    const url = aliases[text] || `https://www.google.com/search?q=${text}`;
    
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0];
      if (currentTab && currentTab.id) {
        chrome.tabs.update(currentTab.id, { url });
      }
    });
  });
});
