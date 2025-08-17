import { defaultAliases } from "./builtIns.js";

document.addEventListener("DOMContentLoaded", function () {
  // DOM Elements
  const aliasForm = document.getElementById("alias-form");
  const aliasInput = document.getElementById("alias");
  const urlInput = document.getElementById("url");
  const aliasList = document.getElementById("alias-list");
  const searchInput = document.getElementById("search-aliases");
  const sortSelect = document.getElementById("sort-aliases");
  
  const loadDefaultsBtn = document.getElementById("load-defaults-btn");
  const exportBtn = document.getElementById("export-btn");
  const importBtn = document.getElementById("import-btn");
  const importFile = document.getElementById("import-file");
  
  const searchTriggerInput = document.getElementById("search-trigger");
  const saveSearchTriggerBtn = document.getElementById("save-search-trigger");
  const omniboxBehaviorSelect = document.getElementById("omnibox-behavior");
  const autoSuggestCheckbox = document.getElementById("auto-suggest");
  const usageTrackingCheckbox = document.getElementById("usage-tracking");
  
  const collectionForm = document.getElementById("collection-form");
  const collectionNameInput = document.getElementById("collection-name");
  const collectionAliasesInput = document.getElementById("collection-aliases-input");
  const collectionAliasesHidden = document.getElementById("collection-aliases");
  const collectionsList = document.getElementById("collections-list");
  
  const totalAliasesSpan = document.getElementById("total-aliases");
  const totalCollectionsSpan = document.getElementById("total-collections");
  const mostUsedAliasSpan = document.getElementById("most-used-alias");
  const resetUsageBtn = document.getElementById("reset-usage-btn");
  const resetAllBtn = document.getElementById("reset-all-btn");

  // State
  let currentAliases = {};
  let currentCollections = {};
  let currentUsage = {};
  let selectedAliases = [];

  // Load all data on startup
  loadAllData();

  // Event Listeners
  aliasForm.addEventListener("submit", saveAlias);
  searchInput.addEventListener("input", handleSearch);
  sortSelect.addEventListener("change", handleSort);
  loadDefaultsBtn.addEventListener("click", loadDefaults);
  exportBtn.addEventListener("click", exportData);
  importBtn.addEventListener("click", () => importFile.click());
  importFile.addEventListener("change", importData);
  
  saveSearchTriggerBtn.addEventListener("click", saveSearchTrigger);
  omniboxBehaviorSelect.addEventListener("change", saveSettings);
  autoSuggestCheckbox.addEventListener("change", saveSettings);
  usageTrackingCheckbox.addEventListener("change", saveSettings);
  
  collectionForm.addEventListener("submit", saveCollection);
  resetUsageBtn.addEventListener("click", resetUsage);
  resetAllBtn.addEventListener("click", resetAllData);

  // Functions
  async function loadAllData() {
    try {
      const data = await chrome.storage.sync.get([
        "aliases", "collections", "aliasUsage", "searchTrigger", 
        "omniboxBehavior", "autoSuggest", "usageTracking"
      ]);
      
      currentAliases = data.aliases || {};
      currentCollections = data.collections || {};
      currentUsage = data.aliasUsage || {};
      
      displayAliases();
      displayCollections();
      loadSettings(data);
      updateStatistics();
      renderHashtagInput();
    } catch (error) {
      console.error("Error loading data:", error);
    }
  }

  function displayAliases() {
    aliasList.innerHTML = "";
    
    if (Object.keys(currentAliases).length === 0) {
      aliasList.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--terminal-text-dim);">No aliases found. Add some aliases to get started!</div>';
      return;
    }

    let sortedAliases = getSortedAliases();
    
    for (const [alias, url] of sortedAliases) {
      const usage = currentUsage[alias] || 0;
      const div = document.createElement("div");
      div.className = "alias-entry";
      div.innerHTML = `
        <div class="alias-info">
          <div class="alias-name" contenteditable="true" data-alias="${alias}">${alias}</div>
          <div class="alias-url" contenteditable="true" data-alias="${alias}">${url}</div>
          <div class="alias-usage">Used ${usage} times</div>
        </div>
        <div class="alias-actions">
          <button data-alias="${alias}" class="edit-btn">Edit</button>
          <button data-alias="${alias}" class="test-btn">Test</button>
          <button data-alias="${alias}" class="delete-btn danger-btn">Delete</button>
        </div>
      `;
      aliasList.appendChild(div);
    }

    addAliasEventListeners();
  }

  function getSortedAliases() {
    const entries = Object.entries(currentAliases);
    const sortMode = sortSelect.value;
    
    switch (sortMode) {
      case "usage":
        return entries.sort((a, b) => (currentUsage[b[0]] || 0) - (currentUsage[a[0]] || 0));
      case "recent":
        // For now, just reverse alphabetical - could be enhanced with timestamps
        return entries.sort((a, b) => b[0].localeCompare(a[0]));
      case "alphabetical":
      default:
        return entries.sort((a, b) => a[0].localeCompare(b[0]));
    }
  }

  function addAliasEventListeners() {
    // Delete buttons
    document.querySelectorAll(".delete-btn").forEach((button) => {
      button.addEventListener("click", (e) => {
        const alias = e.target.getAttribute("data-alias");
        deleteAlias(alias);
      });
    });

    // Test buttons
    document.querySelectorAll(".test-btn").forEach((button) => {
      button.addEventListener("click", (e) => {
        const alias = e.target.getAttribute("data-alias");
        testAlias(alias);
      });
    });

    // Editable fields
    document.querySelectorAll(".alias-url").forEach((div) => {
      div.addEventListener("blur", (e) => {
        const alias = e.target.getAttribute("data-alias");
        const newUrl = e.target.textContent.trim();
        if (newUrl && newUrl !== currentAliases[alias]) {
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

  function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase().trim();
    
    if (!searchTerm) {
      displayAliases();
      return;
    }

    const filteredAliases = Object.fromEntries(
      Object.entries(currentAliases).filter(([alias, url]) => 
        alias.toLowerCase().includes(searchTerm) || 
        url.toLowerCase().includes(searchTerm)
      )
    );

    // Temporarily update currentAliases for display
    const originalAliases = currentAliases;
    currentAliases = filteredAliases;
    displayAliases();
    currentAliases = originalAliases;
  }

  function handleSort() {
    displayAliases();
  }

  function saveAlias(event) {
    event.preventDefault();
    
    const alias = aliasInput.value.trim();
    const url = urlInput.value.trim();

    if (!alias || !url) {
      alert("Please fill in both fields.");
      return;
    }

    if (currentAliases[alias]) {
      alert(`Alias "${alias}" already exists.`);
      return;
    }

    currentAliases[alias] = url;
    chrome.storage.sync.set({ aliases: currentAliases }, () => {
      aliasInput.value = "";
      urlInput.value = "";
      displayAliases();
      updateStatistics();
      renderHashtagInput();
      showNotification(`Alias "${alias}" added successfully!`);
    });
  }

  function saveEditedAlias(alias, newUrl) {
    currentAliases[alias] = newUrl;
    chrome.storage.sync.set({ aliases: currentAliases }, () => {
      showNotification(`Alias "${alias}" updated!`);
    });
  }

  function deleteAlias(alias) {
    if (confirm(`Are you sure you want to delete the alias "${alias}"?`)) {
      delete currentAliases[alias];
      chrome.storage.sync.set({ aliases: currentAliases }, () => {
        displayAliases();
        updateStatistics();
        renderHashtagInput();
        showNotification(`Alias "${alias}" deleted!`);
      });
    }
  }

  function renameAlias(oldAlias, newAlias) {
    currentAliases[newAlias] = currentAliases[oldAlias];
    delete currentAliases[oldAlias];
    
    // Also update usage data
    if (currentUsage[oldAlias]) {
      currentUsage[newAlias] = currentUsage[oldAlias];
      delete currentUsage[oldAlias];
      chrome.storage.sync.set({ aliasUsage: currentUsage });
    }
    
    chrome.storage.sync.set({ aliases: currentAliases }, () => {
      displayAliases();
      updateStatistics();
      renderHashtagInput();
      showNotification(`Alias renamed from "${oldAlias}" to "${newAlias}"!`);
    });
  }

  function testAlias(alias) {
    const url = currentAliases[alias];
    if (url) {
      const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
      chrome.tabs.create({ url: normalizedUrl });
      showNotification(`Testing alias "${alias}"...`);
    }
  }

  function loadDefaults() {
    if (confirm("This will add default aliases. Existing aliases will not be overwritten. Continue?")) {
      let addedCount = 0;
      
      for (const [alias, url] of Object.entries(defaultAliases)) {
        if (!currentAliases[alias]) {
          currentAliases[alias] = url;
          addedCount++;
        }
      }

      chrome.storage.sync.set({ aliases: currentAliases }, () => {
        displayAliases();
        updateStatistics();
        renderHashtagInput();
        showNotification(`Added ${addedCount} default aliases!`);
      });
    }
  }

  function exportData() {
    const exportData = {
      aliases: currentAliases,
      collections: currentCollections,
      aliasUsage: currentUsage,
      exportDate: new Date().toISOString(),
      version: "1.5"
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `urlias-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification("Data exported successfully!");
  }

  function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const importData = JSON.parse(e.target.result);
        
        if (!importData.aliases && !importData.collections) {
          alert("Invalid backup file format.");
          return;
        }

        const confirmMessage = `Import data from backup?\n\n` +
          `Aliases: ${Object.keys(importData.aliases || {}).length}\n` +
          `Collections: ${Object.keys(importData.collections || {}).length}\n` +
          `Export Date: ${importData.exportDate || 'Unknown'}\n\n` +
          `This will merge with existing data.`;

        if (confirm(confirmMessage)) {
          // Merge aliases
          Object.assign(currentAliases, importData.aliases || {});
          Object.assign(currentCollections, importData.collections || {});
          Object.assign(currentUsage, importData.aliasUsage || {});

          chrome.storage.sync.set({
            aliases: currentAliases,
            collections: currentCollections,
            aliasUsage: currentUsage
          }, () => {
            displayAliases();
            displayCollections();
            updateStatistics();
            renderHashtagInput();
            showNotification("Data imported successfully!");
          });
        }
      } catch (error) {
        alert("Error reading backup file: " + error.message);
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
  }

  function loadSettings(data) {
    searchTriggerInput.value = data.searchTrigger || "search";
    omniboxBehaviorSelect.value = data.omniboxBehavior || "current-tab";
    autoSuggestCheckbox.checked = data.autoSuggest !== false;
    usageTrackingCheckbox.checked = data.usageTracking !== false;
  }

  function saveSearchTrigger() {
    const trigger = searchTriggerInput.value.trim();
    if (!trigger) {
      alert("Search trigger word cannot be empty.");
      return;
    }
    chrome.storage.sync.set({ searchTrigger: trigger }, () => {
      showNotification(`Search trigger word set to '${trigger}'!`);
    });
  }

  function saveSettings() {
    const settings = {
      omniboxBehavior: omniboxBehaviorSelect.value,
      autoSuggest: autoSuggestCheckbox.checked,
      usageTracking: usageTrackingCheckbox.checked
    };
    
    chrome.storage.sync.set(settings, () => {
      showNotification("Settings saved!");
    });
  }

  // Collection functions (simplified from popup.js)
  function renderHashtagInput() {
    collectionAliasesInput.innerHTML = "";
    selectedAliases.forEach((alias, idx) => {
      const tag = document.createElement("span");
      tag.className = "hashtag-tag";
      tag.textContent = alias;
      
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

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = selectedAliases.length ? "Add another alias..." : "Type alias name...";
    input.addEventListener("keydown", function(e) {
      if (e.key === "Enter" && this.value.trim()) {
        e.preventDefault();
        addAliasTag(this.value.trim());
        this.value = "";
      } else if (e.key === "Backspace" && !this.value && selectedAliases.length) {
        selectedAliases.pop();
        renderHashtagInput();
        updateHiddenAliases();
      }
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

  function saveCollection(e) {
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
    
    currentCollections[name] = selectedAliases.join(",");
    chrome.storage.sync.set({ collections: currentCollections }, () => {
      showNotification(`Collection '${name}' saved!`);
      collectionNameInput.value = "";
      selectedAliases = [];
      renderHashtagInput();
      displayCollections();
      updateStatistics();
    });
  }

  function displayCollections() {
    collectionsList.innerHTML = "";
    const entries = Object.entries(currentCollections);
    
    if (!entries.length) {
      collectionsList.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--terminal-text-dim);">No collections yet.</div>';
      return;
    }
    
    for (const [name, aliasesStr] of entries) {
      const div = document.createElement("div");
      div.className = "collection-entry";
      div.innerHTML = `
        <div class="collection-info">
          <div class="collection-name">${name}</div>
          <div class="collection-aliases">${aliasesStr}</div>
        </div>
        <div class="collection-actions">
          <button data-collection="${name}" class="test-collection-btn">Test</button>
          <button data-collection="${name}" class="delete-collection-btn danger-btn">Delete</button>
        </div>
      `;
      collectionsList.appendChild(div);
    }

    addCollectionEventListeners();
  }

  function addCollectionEventListeners() {
    document.querySelectorAll(".delete-collection-btn").forEach((button) => {
      button.addEventListener("click", (e) => {
        const name = e.target.getAttribute("data-collection");
        if (confirm(`Delete collection '${name}'?`)) {
          delete currentCollections[name];
          chrome.storage.sync.set({ collections: currentCollections }, () => {
            displayCollections();
            updateStatistics();
            showNotification(`Collection '${name}' deleted!`);
          });
        }
      });
    });

    document.querySelectorAll(".test-collection-btn").forEach((button) => {
      button.addEventListener("click", (e) => {
        const name = e.target.getAttribute("data-collection");
        const aliases = currentCollections[name].split(",");
        
        if (confirm(`Open ${aliases.length} tabs for collection '${name}'?`)) {
          aliases.forEach((alias, index) => {
            const url = currentAliases[alias.trim()];
            if (url) {
              const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
              setTimeout(() => {
                chrome.tabs.create({ url: normalizedUrl, active: index === 0 });
              }, index * 100); // Stagger tab opening
            }
          });
          showNotification(`Opening collection '${name}'...`);
        }
      });
    });
  }

  function updateStatistics() {
    totalAliasesSpan.textContent = Object.keys(currentAliases).length;
    totalCollectionsSpan.textContent = Object.keys(currentCollections).length;
    
    const mostUsed = Object.entries(currentUsage)
      .sort((a, b) => b[1] - a[1])[0];
    
    mostUsedAliasSpan.textContent = mostUsed ? 
      `${mostUsed[0]} (${mostUsed[1]} times)` : 
      "None";
  }

  function resetUsage() {
    if (confirm("Reset all usage statistics? This cannot be undone.")) {
      chrome.storage.sync.set({ aliasUsage: {} }, () => {
        currentUsage = {};
        displayAliases();
        updateStatistics();
        showNotification("Usage statistics reset!");
      });
    }
  }

  function resetAllData() {
    const confirmText = "DELETE ALL DATA";
    const userInput = prompt(
      `This will delete ALL aliases, collections, and settings!\n\n` +
      `Type "${confirmText}" to confirm this action:`
    );
    
    if (userInput === confirmText) {
      chrome.storage.sync.clear(() => {
        currentAliases = {};
        currentCollections = {};
        currentUsage = {};
        selectedAliases = [];
        
        displayAliases();
        displayCollections();
        updateStatistics();
        renderHashtagInput();
        loadSettings({});
        
        showNotification("All data has been reset!");
      });
    }
  }

  function showNotification(message) {
    // Create a simple notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--terminal-highlight);
      color: var(--terminal-text);
      border: 1px solid var(--terminal-text);
      padding: 15px 20px;
      z-index: 1000;
      font-family: var(--terminal-font);
      box-shadow: 0 0 10px rgba(51, 255, 51, 0.5);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }
});
