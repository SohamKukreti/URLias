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
      div.innerHTML = `
        <span class="alias-name">${alias}:</span>
        <div class="alias-url" contenteditable="true" data-alias="${alias}">${url}</div>
        <div class="alias-actions">
          <button data-alias="${alias}" class="delete-btn">Delete</button>
        </div>
      `;
      aliasList.appendChild(div);
    }

    document.querySelectorAll(".delete-btn").forEach(button => {
      button.addEventListener("click", (e) => {
        const alias = e.target.getAttribute("data-alias");
        deleteAlias(alias);
      });
    });

    document.querySelectorAll(".alias-url").forEach(div => {
      div.addEventListener("input", (e) => {
        const alias = e.target.getAttribute("data-alias");
        const newUrl = e.target.textContent.trim();
        if (newUrl) {
          saveEditedAlias(alias, newUrl);
        }
      });
    });
  });
}

function saveAlias() {
  const alias = aliasInput.value.trim();
  const url = urlInput.value.trim();

  if (!alias || !url) {
    alert("Please fill in both fields.");
    return;
  }

  chrome.storage.sync.get("aliases", (data) => {
    const aliases = data.aliases || {};

    if (aliases[alias]) {
      alert(`Alias "${alias}" already exists.`);
      return;
    }

    aliases[alias] = url;
    chrome.storage.sync.set({ aliases }, () => {
      aliasInput.value = "";
      urlInput.value = "";
      loadAliases();
    });
  });
}

function saveEditedAlias(alias, newUrl) {
  chrome.storage.sync.get("aliases", (data) => {
    const aliases = data.aliases || {};
    if (aliases[alias] !== newUrl) {
      aliases[alias] = newUrl;
      chrome.storage.sync.set({ aliases });
    }
  });
}

function deleteAlias(alias) {
  if (confirm(`Are you sure you want to delete the alias "${alias}"?`)) {
    chrome.storage.sync.get("aliases", (data) => {
      const aliases = data.aliases || {};
      delete aliases[alias];
      chrome.storage.sync.set({ aliases }, loadAliases);
    });
  }
}

saveBtn.addEventListener("click", saveAlias);
document.addEventListener("DOMContentLoaded", loadAliases);
