chrome.omnibox.onInputEntered.addListener((text) => {
    chrome.storage.sync.get("aliases", (data) => {
      const aliases = data.aliases || {};
      const url = aliases[text] || `https://www.google.com/search?q=${text}`;
      chrome.tabs.create({ url });
    });
  });
  