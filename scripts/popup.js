document.addEventListener("DOMContentLoaded", function () {
  const defaultAliases = {
    "yt": "https://youtube.com",
    "gh": "https://github.com",
    "gm": "https://mail.google.com",
    "rd": "https://reddit.com",
    "tw": "https://twitter.com",
    "ig": "https://instagram.com",
    "fb": "https://facebook.com",
    "ln": "https://linkedin.com",
    "so": "https://stackoverflow.com",
    "wa": "https://web.whatsapp.com",
    "gp": "https://photos.google.com",
    "gmaps": "https://maps.google.com",
    "amz": "https://amazon.in",
    "mdn": "https://developer.mozilla.org",
    "lc": "https://leetcode.com",
    "ytm": "https://music.youtube.com",
    "dev": "https://dev.to",
    "hn": "https://news.ycombinator.com",
    "tg": "https://web.telegram.org",
    "pin": "https://pinterest.com",
    "net": "https://netflix.com",
    "sp": "https://spotify.com"
  };
  const aliasForm = document.getElementById("alias-form");
  const aliasInput = document.getElementById("alias");
  const urlInput = document.getElementById("url");
  const aliasList = document.getElementById("alias-list");

  const loadDefaultsBtn = document.getElementById("load-defaults-btn");
  loadDefaultsBtn.addEventListener("click", function () {
    chrome.storage.sync.get("aliases", (data) => {
      const aliases = data.aliases || {};

      for (const [alias, url] of Object.entries(defaultAliases)) {
        if (!aliases[alias]) {
          aliases[alias] = url;
        }
      }

      chrome.storage.sync.set({ aliases }, loadAliases);
      alert("Loaded default aliases sucessfully")
    });
  });

  const searchInput = document.getElementById("search-aliases");
  let currentAliases = {};

  function filterAliases(searchTerm) {
    const filteredEntries = Object.entries(currentAliases).filter(([alias, url]) => {
      const search = searchTerm.toLowerCase();
      return alias.toLowerCase().includes(search) || url.toLowerCase().includes(search);
    });

    displayAliases(Object.fromEntries(filteredEntries));
  }

  searchInput.addEventListener("input", (e) => {
    filterAliases(e.target.value.trim());
  });

  function displayAliases(aliases) {
    aliasList.innerHTML = "";

    if (Object.keys(aliases).length === 0) {
      aliasList.textContent = "No aliases found.";
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

    // Add event listeners for delete buttons and editable URLs
    addEventListeners();
  }

  function addEventListeners() {
    document.querySelectorAll(".delete-btn").forEach((button) => {
      button.addEventListener("click", (e) => {
        const alias = e.target.getAttribute("data-alias");
        deleteAlias(alias);
      });
    });

    document.querySelectorAll(".alias-url").forEach((div) => {
      div.addEventListener("input", (e) => {
        const alias = e.target.getAttribute("data-alias");
        const newUrl = e.target.textContent.trim();
        if (newUrl) {
          saveEditedAlias(alias, newUrl);
        }
      });
    });
  }

  function loadAliases() {
    chrome.storage.sync.get("aliases", (data) => {
      currentAliases = data.aliases || {};
      displayAliases(currentAliases);
    });
  }

  function saveAlias(event) {
    event.preventDefault(); 

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

  aliasForm.addEventListener("submit", saveAlias);
  loadAliases();
});
