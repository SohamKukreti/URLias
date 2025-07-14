import { defaultAliases } from "./builtIns.js";

document.addEventListener("DOMContentLoaded", function () {

  const aliasForm = document.getElementById("alias-form");
  const aliasInput = document.getElementById("alias");
  const urlInput = document.getElementById("url");
  const aliasList = document.getElementById("alias-list");
  const statusMessage = document.getElementById("status-message"); // Optional: Add an element for status messages

  const loadDefaultsBtn = document.getElementById("load-defaults-btn");
  loadDefaultsBtn.addEventListener("click", async function () {
    try {
      const data = await browser.storage.sync.get("aliases");
      const aliases = data.aliases || {};

      for (const [alias, url] of Object.entries(defaultAliases)) {
        if (!aliases[alias]) {
          aliases[alias] = url;
        }
      }

      await browser.storage.sync.set({ aliases });
      await loadAliases();
      // Replace alert with browser notification
      showNotification("URLias", "Default aliases loaded successfully", browser.runtime.getURL("assets/icon128.png"));
    } catch (error) {
      console.error("Error loading defaults:", error);
      showNotification("URLias Error", "Error loading default aliases", browser.runtime.getURL("assets/icon128.png"));
    }
  });

  // Utility: Simplified async get from storage using Promises
  async function getStorageData(key) {
    try {
      // browser.storage.sync.get returns a Promise
      const result = await browser.storage.sync.get(key);
      return result; // Return the whole result object
    } catch (error) {
      console.error(`Error getting storage data for key "${key}":`, error);
      showNotification("URLias Error", `Error loading data: ${error.message}`, browser.runtime.getURL("assets/icon128.png"));
      throw error; // Re-throw error to be caught by callers if needed
    }
  }

  // Utility: Simplified async set to storage using Promises
  async function setStorageData(data) {
    try {
      // browser.storage.sync.set returns a Promise
      await browser.storage.sync.set(data);
    } catch (error) {
      console.error("Error setting storage data:", error);
      showNotification("URLias Error", `Error saving data: ${error.message}`, browser.runtime.getURL("assets/icon128.png"));
      throw error; // Re-throw error
    }
  }

  function showNotification(title, message, iconUrl) {
    browser.notifications.create({
      type: "basic",
      title: title,
      message: message,
      iconUrl: iconUrl
    });
  }

  const searchInput = document.getElementById("search-aliases");
  let currentAliases = {}; // Store current aliases for filtering

  async function loadAliases() {
    try {
      const data = await getStorageData("aliases");
      currentAliases = data.aliases || {};
      displayFilteredAliases(currentAliases);
    } catch (error) {
      console.error("Failed to load aliases in UI:", error);
      aliasList.innerHTML = "<li>Error loading aliases.</li>";
    }
  }

  function displayFilteredAliases(aliases, searchTerm = '') {
    aliasList.innerHTML = "";
    
    let filteredAliases = Object.entries(aliases);
    
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filteredAliases = filteredAliases.filter(([alias, data]) => {
        const url = typeof data === 'string' ? data : data.url;
        return alias.toLowerCase().includes(search) || 
               url.toLowerCase().includes(search);
      });
    }

    if (filteredAliases.length === 0) {
      aliasList.innerHTML = searchTerm ? 
        "<div>No matching aliases found.</div>" : 
        "<div>No aliases saved yet.</div>";
      return;
    }

    // Sort aliases alphabetically
    filteredAliases.sort((a, b) => a[0].localeCompare(b[0]));

    for (const [alias, data] of filteredAliases) {
      const url = typeof data === 'string' ? data : data.url;
      const starred = typeof data === 'object' ? data.starred : false;
      
      const div = document.createElement("div");
      div.className = "alias-entry";
      div.innerHTML = `
        <span class="star-icon ${starred ? 'starred' : ''}" data-alias="${alias}"></span>
        <span class="alias-name">${alias}:</span>
        <br>
        <div class="alias-url" contenteditable="true" data-alias="${alias}">${url}</div>
        <div class="alias-actions">
          <button data-alias="${alias}" class="delete-btn">Delete</button>
        </div>
      `;
      aliasList.appendChild(div);
    }

    // Add event listeners for the newly created elements
    document.querySelectorAll(".delete-btn").forEach(button => {
      button.addEventListener("click", () => {
        deleteAlias(button.getAttribute("data-alias"));
      });
    });

    document.querySelectorAll(".star-icon").forEach(star => {
      star.addEventListener("click", () => {
        toggleStarred(star.getAttribute("data-alias"));
      });
    });

    document.querySelectorAll(".alias-url").forEach(urlDiv => {
      urlDiv.addEventListener("input", (e) => {
        const alias = e.target.getAttribute("data-alias");
        const newUrl = e.target.textContent.trim();
        if (newUrl) {
          saveEditedAlias(alias, newUrl);
        }
      });
    });
  }

  searchInput.addEventListener("input", (e) => {
    displayFilteredAliases(currentAliases, e.target.value.trim());
  });

  async function saveAlias(event) {
    event.preventDefault(); // Prevent form submission

    const alias = aliasInput.value.trim();
    const url = urlInput.value.trim();

    if (!alias || !url) {
      showNotification("URLias Error", "Please fill in both alias and URL fields.", browser.runtime.getURL("assets/icon128.png"));
      return;
    }

    try {
      const data = await getStorageData("aliases");
      const aliases = data.aliases || {};

      if (aliases.hasOwnProperty(alias)) { // More robust check than just aliases[alias]
        showNotification("URLias Error", `Alias "${alias}" already exists. Edit it below or choose a different name.`, browser.runtime.getURL("assets/icon128.png"));
        return;
      }

      aliases[alias] = url;
      await setStorageData({ aliases: aliases }); // Pass the updated object { aliases: ... }
      showNotification("URLias", `Alias "${alias}" saved successfully!`, browser.runtime.getURL("assets/icon128.png"));
      aliasInput.value = ""; // Clear form fields
      urlInput.value = "";
      await loadAliases(); // Refresh the list
    } catch (error) {
       // Error should be caught and logged by setStorageData/getStorageData
       console.error("Error during alias save operation:", error);
    }
  }

  async function saveEditedAlias(alias, newUrl) {
    if (!newUrl) {
        showNotification("URLias Error", `URL for alias "${alias}" cannot be empty.`, browser.runtime.getURL("assets/icon128.png"));
        // Maybe reload aliases to revert the change visually if needed?
        loadAliases();
        return;
    }
    try {
      const data = await getStorageData("aliases");
      const aliases = data.aliases || {};
      if (aliases[alias] !== newUrl) { // Only save if changed
        aliases[alias] = newUrl;
        await setStorageData({ aliases: aliases });
        // No reload needed here unless debouncing failed or concurrent edits are possible
      }
    } catch (error) {
      console.error(`Error saving edited alias "${alias}":`, error);
      // Status message handled by setStorageData
    }
  }

  function showConfirmModal(message) {
    return new Promise((resolve) => {
      const modal = document.getElementById('confirm-modal');
      const messageEl = document.getElementById('modal-message');
      const confirmBtn = document.getElementById('modal-confirm');
      const cancelBtn = document.getElementById('modal-cancel');

      messageEl.textContent = message;
      modal.style.display = 'block';

      function cleanup() {
        modal.style.display = 'none';
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
      }

      function handleConfirm() {
        cleanup();
        resolve(true);
      }

      function handleCancel() {
        cleanup();
        resolve(false);
      }

      confirmBtn.addEventListener('click', handleConfirm);
      cancelBtn.addEventListener('click', handleCancel);
    });
  }

  async function deleteAlias(alias) {
    try {
      const confirmed = await showConfirmModal(`Do you want to delete the alias "${alias}"?`);
      
      if (confirmed) {
        const data = await getStorageData("aliases");
        const aliases = data.aliases || {};
        
        if (aliases.hasOwnProperty(alias)) {
          delete aliases[alias];
          await setStorageData({ aliases });
          await loadAliases();
          
          showNotification("Success", `Alias "${alias}" has been deleted`, browser.runtime.getURL("assets/icon128.png"));
        }
      }
    } catch (error) {
      console.error("Error during alias deletion:", error);
      await browser.notifications.create({
        type: "basic",
        title: "Error",
        message: "Failed to delete alias",
        iconUrl: browser.runtime.getURL("assets/icon128.png")
      });
    }
  }

  // Initial setup
  aliasForm.addEventListener("submit", saveAlias);
  loadAliases(); // Load aliases when popup opens

  const searchTriggerInput = document.getElementById("search-trigger");
  const saveSearchTriggerBtn = document.getElementById("save-search-trigger");

  // Load and display the current search trigger word
  async function loadSearchTrigger() {
    try {
      const data = await browser.storage.sync.get("searchTrigger");
      searchTriggerInput.value = data.searchTrigger || "search";
    } catch (error) {
      console.error("Error loading search trigger:", error);
      showNotification("URLias Error", "Error loading search trigger", browser.runtime.getURL("assets/icon128.png"));
    }
  }

  // Save the search trigger word
  saveSearchTriggerBtn.addEventListener("click", async function () {
    const trigger = searchTriggerInput.value.trim();
    if (!trigger) {
      showNotification("URLias Error", "Search trigger word cannot be empty.", browser.runtime.getURL("assets/icon128.png"));
      return;
    }
    try {
      await browser.storage.sync.set({ searchTrigger: trigger });
      showNotification("URLias", `Search trigger word set to '${trigger}'!`, browser.runtime.getURL("assets/icon128.png"));
    } catch (error) {
      console.error("Error saving search trigger:", error);
      showNotification("URLias Error", "Error saving search trigger", browser.runtime.getURL("assets/icon128.png"));
    }
  });

  // Call on popup load
  loadSearchTrigger();

  // --- Collections Section Logic ---
  const collectionForm = document.getElementById("collection-form");
  const collectionNameInput = document.getElementById("collection-name");
  const collectionAliasesInput = document.getElementById("collection-aliases-input");
  const collectionAliasesHidden = document.getElementById("collection-aliases");
  const collectionsList = document.getElementById("collections-list");

  let selectedAliases = [];
  let collections = {};

  // Recommend alias for the first tag
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
      // Show recommendation for first alias
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
    console.log("addAliasTag triggered for alias:", alias);
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
        // Instead of addAliasTag, set the input value to the alias
        const input = collectionAliasesInput.querySelector("input");
        if (input) {
          input.value = alias;
          input.focus();
          // Optionally, move cursor to end
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

  // Save collection
  collectionForm.addEventListener("submit", async function(e) {
    e.preventDefault();
    const name = collectionNameInput.value.trim();
    if (!name) {
      showNotification("URLias", "Collection name required", browser.runtime.getURL("assets/icon128.png"));
      return;
    }
    if (!selectedAliases.length) {
      showNotification("URLias", "Add at least one alias to the collection", browser.runtime.getURL("assets/icon128.png"));
      return;
    }
    // No longer validate the first alias, just recommend
    try {
      const data = await getStorageData("collections");
      collections = data.collections || {};
      collections[name] = selectedAliases.join(",");
      await setStorageData({ collections });
      showNotification("URLias", `Collection '${name}' saved!`, browser.runtime.getURL("assets/icon128.png"));
      collectionNameInput.value = "";
      selectedAliases = [];
      renderHashtagInput();
      await loadCollections();
    } catch (error) {
      showNotification("URLias", "Error saving collection", browser.runtime.getURL("assets/icon128.png"));
    }
  });

  // Load and display collections
  async function loadCollections() {
    try {
      const data = await getStorageData("collections");
      collections = data.collections || {};
      renderCollectionsList();
    } catch (error) {
      collectionsList.innerHTML = "<div>Error loading collections.</div>";
    }
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
      delBtn.addEventListener("click", async () => {
        const confirmed = await showConfirmModal(`Delete collection '${name}'?`);
        if (confirmed) {
          delete collections[name];
          await setStorageData({ collections });
          await loadCollections();
          showNotification("URLias", `Collection '${name}' deleted`, browser.runtime.getURL("assets/icon128.png"));
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
  loadAliases = async function() {
    await origLoadAliases();
    renderHashtagInput();
  };

  // Initial render
  renderHashtagInput();
  loadCollections();
});