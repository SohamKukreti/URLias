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
  const statusMessage = document.getElementById("status-message"); // Optional: Add an element for status messages

  const loadDefaultsBtn = document.getElementById("load-defaults-btn");
  const searchInput = document.getElementById("search-aliases");
  let currentAliases = {}; // Store current aliases for filtering

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
      await browser.notifications.create({
        type: "basic",
        title: "URLias",
        message: "Default aliases loaded successfully",
        iconUrl: browser.runtime.getURL("assets/icon48.png")
      });
    } catch (error) {
      console.error("Error loading defaults:", error);
      await browser.notifications.create({
        type: "basic",
        title: "URLias Error",
        message: "Error loading default aliases",
        iconUrl: browser.runtime.getURL("assets/icon48.png")
      });
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
      setStatusMessage(`Error loading data: ${error.message}`, true);
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
      setStatusMessage(`Error saving data: ${error.message}`, true);
      throw error; // Re-throw error
    }
  }

  // Helper to display status messages (optional but good UX)
  function setStatusMessage(message, isError = false) {
      if (statusMessage) {
          statusMessage.textContent = message;
          statusMessage.className = isError ? 'status-error' : 'status-success';
          // Clear message after a few seconds
          setTimeout(() => {
              if (statusMessage.textContent === message) { // Avoid clearing newer messages
                 statusMessage.textContent = '';
                 statusMessage.className = '';
              }
          }, 3000);
      } else {
          // Fallback if status element doesn't exist
          console.log(`Status: ${message}`);
          if(isError) alert(`Error: ${message}`);
      }
  }

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

  async function saveAlias(event) {
    event.preventDefault(); // Prevent form submission

    const alias = aliasInput.value.trim();
    const url = urlInput.value.trim();

    if (!alias || !url) {
      setStatusMessage("Please fill in both alias and URL fields.", true);
      return;
    }

    try {
      const data = await getStorageData("aliases");
      const aliases = data.aliases || {};

      if (aliases.hasOwnProperty(alias)) { // More robust check than just aliases[alias]
        setStatusMessage(`Alias "${alias}" already exists. Edit it below or choose a different name.`, true);
        return;
      }

      aliases[alias] = url;
      await setStorageData({ aliases: aliases }); // Pass the updated object { aliases: ... }
      setStatusMessage(`Alias "${alias}" saved successfully!`, false);
      aliasInput.value = ""; // Clear form fields
      urlInput.value = "";
      await loadAliases(); // Refresh the list
    } catch (error) {
       // Error should be caught and logged by setStorageData/getStorageData
       // No need to call setStatusMessage here again unless adding more context
       console.error("Error during alias save operation:", error);
    }
  }

  async function saveEditedAlias(alias, newUrl) {
    if (!newUrl) {
        setStatusMessage(`URL for alias "${alias}" cannot be empty.`, true);
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
        setStatusMessage(`Alias "${alias}" updated.`, false);
        // No reload needed here unless debouncing failed or concurrent edits are possible
      }
    } catch (error) {
      console.error(`Error saving edited alias "${alias}":`, error);
      // Status message handled by setStorageData
    }
  }

  async function deleteAlias(alias) {
    // Use confirm for user verification
    if (confirm(`Are you sure you want to delete the alias "${alias}"?`)) {
      try {
        const data = await getStorageData("aliases");
        const aliases = data.aliases || {};
        if (aliases.hasOwnProperty(alias)) {
          delete aliases[alias];
          await setStorageData({ aliases: aliases });
          setStatusMessage(`Alias "${alias}" deleted.`, false);
          await loadAliases(); // Refresh the list
        } else {
            setStatusMessage(`Alias "${alias}" not found for deletion.`, true);
        }
      } catch (error) {
        console.error(`Error deleting alias "${alias}":`, error);
         // Status message handled by setStorageData/getStorageData
      }
    }
  }

  // Add search event listener
  searchInput.addEventListener("input", (e) => {
    displayFilteredAliases(currentAliases, e.target.value.trim());
  });

  // Initial setup
  aliasForm.addEventListener("submit", saveAlias);
  loadAliases(); // Load aliases when popup opens
});