import { defaultAliases } from "./builtIns.js";

document.addEventListener("DOMContentLoaded", function () {
  
  const aliasForm = document.getElementById("alias-form");
  const aliasInput = document.getElementById("alias");
  const urlInput = document.getElementById("url");
  const aliasList = document.getElementById("alias-list");

  const loadDefaultsBtn = document.getElementById("load-defaults-btn");
  const optionsBtn = document.getElementById("options-btn");
  
  // Options button event listener
  optionsBtn.addEventListener("click", function () {
    chrome.runtime.openOptionsPage();
  });

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
        <div class="alias-name" contenteditable="true" data-alias="${alias}">${alias}</div>:
        <div class="alias-url" contenteditable="true" data-alias="${alias}">${url}</div>
        <div class="alias-actions">
          <button data-alias="${alias}" class="delete-btn">Delete</button>
        </div>
      `;
      aliasList.appendChild(div);
    }

    // Add event listeners for delete buttons and editable fields
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

    document.querySelectorAll(".alias-name").forEach((div) => {
      div.addEventListener("blur", (e) => {
        const oldAlias = e.target.getAttribute("data-alias");
        const newAlias = e.target.textContent.trim();
        if (!newAlias || newAlias === oldAlias) return;
        if (currentAliases[newAlias]) {
          alert(`Alias "${newAlias}" already exists.`);
          e.target.textContent = oldAlias;
          return;
        }
        renameAlias(oldAlias, newAlias);
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

  function renameAlias(oldAlias, newAlias) {
    chrome.storage.sync.get("aliases", (data) => {
      const aliases = data.aliases || {};
      if (!aliases[oldAlias]) return;
      aliases[newAlias] = aliases[oldAlias];
      delete aliases[oldAlias];
      chrome.storage.sync.set({ aliases }, loadAliases);
    });
  }

  aliasForm.addEventListener("submit", saveAlias);
  loadAliases();

  // --- Search Trigger Logic ---
  const searchTriggerInput = document.getElementById("search-trigger");
  const saveSearchTriggerBtn = document.getElementById("save-search-trigger");

  function loadSearchTrigger() {
    chrome.storage.sync.get("searchTrigger", (data) => {
      searchTriggerInput.value = data.searchTrigger || "search";
    });
  }

  saveSearchTriggerBtn.addEventListener("click", function () {
    const trigger = searchTriggerInput.value.trim();
    if (!trigger) {
      alert("Search trigger word cannot be empty.");
      return;
    }
    chrome.storage.sync.set({ searchTrigger: trigger }, () => {
      alert(`Search trigger word set to '${trigger}'!`);
    });
  });

  loadSearchTrigger();

  // --- Collections Section Logic ---
  const collectionForm = document.getElementById("collection-form");
  const collectionNameInput = document.getElementById("collection-name");
  const collectionAliasesInput = document.getElementById("collection-aliases-input");
  const collectionAliasesHidden = document.getElementById("collection-aliases");
  const collectionsList = document.getElementById("collections-list");

  let selectedAliases = [];
  let collections = {};

  function renderHashtagInput() {
    collectionAliasesInput.innerHTML = "";
    selectedAliases.forEach((alias, idx) => {
      const tag = document.createElement("span");
      tag.className = "hashtag-tag";
      tag.textContent = alias;
      if (idx === 0 && currentAliases[alias]) {
        tag.title = "Recommended: This matches a saved alias.";
        tag.style.borderColor = "#33ff33";
        tag.style.boxShadow = "0 0 4px #33ff33";
      }
      const remove = document.createElement("span");
      remove.className = "remove-tag";
      remove.textContent = "×";
      remove.addEventListener("click", (e) => {
        e.stopPropagation();
        selectedAliases = selectedAliases.filter(a => a !== alias);
        renderHashtagInput();
        updateHiddenAliases();
      });
      tag.appendChild(remove);
      collectionAliasesInput.appendChild(tag);
    });
    // Add input for searching/adding aliases
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = selectedAliases.length ? "Click to add alias..." : "Type alias name...";
    input.autocomplete = "off";
    input.addEventListener("input", function() {
      showAliasSuggestions(this.value);
      if (selectedAliases.length === 0 && currentAliases[this.value.trim()]) {
        this.style.borderColor = "#33ff33";
        this.title = "Recommended: This matches a saved alias.";
      } else {
        this.style.borderColor = "var(--terminal-text-dim)";
        this.title = "";
      }
    });
    input.addEventListener("keydown", function(e) {
      if (e.key === "Enter" && this.value.trim()) {
        e.preventDefault();
        addAliasTag(this.value.trim());
        this.value = "";
        hideAliasSuggestions();
      } else if (e.key === "Backspace" && !this.value && selectedAliases.length) {
        selectedAliases.pop();
        renderHashtagInput();
        updateHiddenAliases();
      }
    });
    input.addEventListener("focus", function() {
      showAliasSuggestions(this.value);
    });
    input.addEventListener("blur", function() {
      setTimeout(hideAliasSuggestions, 100);
    });
    collectionAliasesInput.appendChild(input);
  }

  function addAliasTag(alias) {
    if (!selectedAliases.includes(alias)) {
      selectedAliases.push(alias);
      renderHashtagInput();
      updateHiddenAliases();
    }
  }

  function updateHiddenAliases() {
    collectionAliasesHidden.value = selectedAliases.join(",");
  }

  // Alias suggestions dropdown
  let suggestionsDropdown = null;
  function showAliasSuggestions(query) {
    hideAliasSuggestions();
    if (!query) return;
    const suggestions = Object.keys(currentAliases)
      .filter(a => a.toLowerCase().includes(query.toLowerCase()) && !selectedAliases.includes(a));
    if (!suggestions.length) return;
    suggestionsDropdown = document.createElement("div");
    suggestionsDropdown.className = "hashtag-suggestions";
    suggestionsDropdown.style.position = "absolute";
    suggestionsDropdown.style.background = "var(--terminal-bg)";
    suggestionsDropdown.style.border = "1px solid var(--terminal-text-dim)";
    suggestionsDropdown.style.zIndex = 10;
    suggestionsDropdown.style.marginTop = "2px";
    suggestionsDropdown.style.left = 0;
    suggestionsDropdown.style.right = 0;
    suggestions.forEach(alias => {
      const item = document.createElement("div");
      item.textContent = alias;
      item.className = "hashtag-suggestion-item";
      item.style.padding = "4px 8px";
      item.style.cursor = "pointer";
      item.addEventListener("mousedown", function(e) {
        e.preventDefault();
        const input = collectionAliasesInput.querySelector("input");
        if (input) {
          input.value = alias;
          input.focus();
          input.setSelectionRange(alias.length, alias.length);
        }
        hideAliasSuggestions();
      });
      suggestionsDropdown.appendChild(item);
    });
    collectionAliasesInput.appendChild(suggestionsDropdown);
  }
  function hideAliasSuggestions() {
    if (suggestionsDropdown && suggestionsDropdown.parentNode) {
      suggestionsDropdown.parentNode.removeChild(suggestionsDropdown);
    }
    suggestionsDropdown = null;
  }

  collectionForm.addEventListener("submit", function(e) {
    e.preventDefault();
    const name = collectionNameInput.value.trim();
    if (!name) {
      alert("Collection name required");
      return;
    }
    if (!selectedAliases.length) {
      alert("Add at least one alias to the collection");
      return;
    }
    chrome.storage.sync.get("collections", (data) => {
      collections = data.collections || {};
      collections[name] = selectedAliases.join(",");
      chrome.storage.sync.set({ collections }, () => {
        alert(`Collection '${name}' saved!`);
        collectionNameInput.value = "";
        selectedAliases = [];
        renderHashtagInput();
        loadCollections();
      });
    });
  });

  function loadCollections() {
    chrome.storage.sync.get("collections", (data) => {
      collections = data.collections || {};
      renderCollectionsList();
    });
  }

  function renderCollectionsList() {
    collectionsList.innerHTML = "";
    const entries = Object.entries(collections);
    if (!entries.length) {
      collectionsList.innerHTML = "<div>No collections yet.</div>";
      return;
    }
    for (const [name, aliasesStr] of entries) {
      const div = document.createElement("div");
      div.className = "collection-entry";
      const nameSpan = document.createElement("span");
      nameSpan.className = "collection-name";
      nameSpan.textContent = name;
      const aliasesSpan = document.createElement("span");
      aliasesSpan.className = "collection-aliases";
      aliasesSpan.textContent = aliasesStr;
      const actions = document.createElement("div");
      actions.className = "collection-actions";
      const delBtn = document.createElement("button");
      delBtn.textContent = "Delete";
      delBtn.addEventListener("click", function() {
        if (confirm(`Delete collection '${name}'?`)) {
          delete collections[name];
          chrome.storage.sync.set({ collections }, () => {
            loadCollections();
            alert(`Collection '${name}' deleted`);
          });
        }
      });
      actions.appendChild(delBtn);
      div.appendChild(nameSpan);
      div.appendChild(aliasesSpan);
      div.appendChild(actions);
      collectionsList.appendChild(div);
    }
  }

  // When aliases are loaded, update hashtag input suggestions
  const origLoadAliases = loadAliases;
  loadAliases = function() {
    origLoadAliases();
    renderHashtagInput();
  };

  // Initial render
  renderHashtagInput();
  loadCollections();
});
