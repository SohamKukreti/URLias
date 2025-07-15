chrome.omnibox.onInputEntered.addListener((text) => {

  const parts = text.trim().split(/\s+/);
  const aliasKey = parts[0];
  // const extraQuery = parts.slice(1).join(" ");
  console.log(text)
  console.log(parts)
  chrome.storage.sync.get("aliases", (data) => {
    const aliases = data.aliases || {};

    let url = aliases[aliasKey];
    let extraQuery = "";
    if (url) {
      for(let i = 1; i < parts.length; i++) {
        const part = parts[i];
        extraQuery += encodeURIComponent(part) + "/";
      }
      if (extraQuery) {
        url = url.replace(/\/+$/, "");
        url += "/" + extraQuery;
      }
    } else {
      url = `https://www.google.com/search?q=${encodeURIComponent(text)}`;
    }

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