// Use 'browser' directly.
// Remove the check/assignment: var browser = typeof browser !== "undefined" ? browser : chrome;

document.addEventListener("DOMContentLoaded", function () {
  const aliasForm = document.getElementById("alias-form");
  const aliasInput = document.getElementById("alias");
  const urlInput = document.getElementById("url");
  const aliasList = document.getElementById("alias-list");
  const statusMessage = document.getElementById("status-message"); // Optional: Add an element for status messages

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

  // Initial setup
  aliasForm.addEventListener("submit", saveAlias);
  loadAliases(); // Load aliases when popup opens
});