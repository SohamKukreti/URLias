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
      const data = await getStorageData("aliases"); // Gets { aliases: { ... } }
      const aliases = data.aliases || {};
      aliasList.innerHTML = ""; // Clear previous list

      if (Object.keys(aliases).length === 0) {
        aliasList.innerHTML = "<li>No aliases saved yet.</li>"; // Use list item for consistency
        return;
      }

      // Sort aliases alphabetically for better readability
      const sortedAliases = Object.entries(aliases).sort((a, b) => a[0].localeCompare(b[0]));

      for (const [alias, url] of sortedAliases) {
        const li = document.createElement("li"); // Use list items for semantic list
        li.className = "alias-entry";
        // Using textContent for safety against XSS in alias/url display
        const aliasSpan = document.createElement('span');
        aliasSpan.className = 'alias-name';
        aliasSpan.textContent = `${alias}: `; // Add colon and space

        const urlDiv = document.createElement('div');
        urlDiv.className = 'alias-url';
        urlDiv.contentEditable = 'true';
        urlDiv.textContent = url;
        urlDiv.setAttribute('data-alias', alias);
        urlDiv.setAttribute('aria-label', `URL for alias ${alias}`); // Accessibility

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'alias-actions';

        const deleteButton = document.createElement('button');
        deleteButton.setAttribute('data-alias', alias);
        deleteButton.className = 'delete-btn';
        deleteButton.textContent = 'Delete';
        deleteButton.setAttribute('aria-label', `Delete alias ${alias}`); // Accessibility

        actionsDiv.appendChild(deleteButton);
        li.appendChild(aliasSpan);
        li.appendChild(urlDiv);
        li.appendChild(actionsDiv);
        aliasList.appendChild(li);

        // Add listeners inside the loop for clarity
        deleteButton.addEventListener("click", async () => {
          await deleteAlias(alias);
        });

        let debounceTimer;
        urlDiv.addEventListener("input", (e) => {
            // Debounce the save operation to avoid saving on every keystroke
            clearTimeout(debounceTimer);
            const newUrl = e.target.textContent.trim();
            const currentAlias = e.target.getAttribute('data-alias');
            if (newUrl) {
                 debounceTimer = setTimeout(async () => {
                     await saveEditedAlias(currentAlias, newUrl);
                     // Optional: Indicate saved status briefly
                     e.target.style.backgroundColor = '#e8f5e9'; // Light green
                     setTimeout(() => { e.target.style.backgroundColor = ''; }, 1000);
                 }, 750); // Save 750ms after user stops typing
            }
        });
         // Handle paste event if needed (stripping formatting)
         urlDiv.addEventListener('paste', (e) => {
            e.preventDefault();
            const text = e.clipboardData.getData('text/plain');
            document.execCommand('insertText', false, text);
         });
      }
    } catch (error) {
      // Error handled in getStorageData, maybe log additional context here
      console.error("Failed to load aliases in UI:", error);
      aliasList.innerHTML = "<li>Error loading aliases.</li>";
    }
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
          
          await browser.notifications.create({
            type: "basic",
            title: "Success",
            message: `Alias "${alias}" has been deleted`,
            iconUrl: browser.runtime.getURL("assets/icon48.png")
          });
        }
      }
    } catch (error) {
      console.error("Error during alias deletion:", error);
      await browser.notifications.create({
        type: "basic",
        title: "Error",
        message: "Failed to delete alias",
        iconUrl: browser.runtime.getURL("assets/icon48.png")
      });
    }
  }

  // Initial setup
  aliasForm.addEventListener("submit", saveAlias);
  loadAliases(); // Load aliases when popup opens
});