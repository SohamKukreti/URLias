const aliasInput = document.getElementById("alias");
const urlInput = document.getElementById("url");
const saveBtn = document.getElementById("save");
const aliasList = document.getElementById("alias-list");

function loadAliases() {
  chrome.storage.sync.get("aliases", (data) => {
    const aliases = data.aliases || {};
    aliasList.innerHTML = "";

    if (Object.keys(aliases).length === 0) {
      aliasList.textContent = "No aliases saved.";
      return;
    }

    for (const [alias, url] of Object.entries(aliases)) {
      const div = document.createElement("div");
      div.className = "alias-entry";
      div.innerHTML = `<span class="alias-name">${alias}</span>: ${url}`;
      aliasList.appendChild(div);
    }
  });
}

saveBtn.addEventListener("click", () => {
  const alias = aliasInput.value.trim();
  const url = urlInput.value.trim();

  if (!alias || !url) {
    alert("Please fill in both fields.");
    return;
  }

  chrome.storage.sync.get("aliases", (data) => {
    const aliases = data.aliases || {};
    aliases[alias] = url;
    chrome.storage.sync.set({ aliases }, () => {
      alert(`Alias "${alias}" saved!`);
      aliasInput.value = "";
      urlInput.value = "";
      loadAliases(); // Refresh the list
    });
  });
});

document.addEventListener("DOMContentLoaded", loadAliases);
