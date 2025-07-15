# URLias

<img src="assets/icon128.png" width="100" align="center" alt="URLias Icon">

URLias is a browser extension that lets you quickly navigate to your favorite websites using simple aliases. By typing a predefined alias (like `gh`) in your browser's address bar, you can instantly jump to the corresponding URL (e.g., `https://github.com`). It even supports wildcard matching, so if you type an alias followed by extra text (for example, `gh user`), URLias will automatically append the extra text as a new path segment (resulting in `https://github.com/user`).

Currently Supports firefox and chromium based browsers (checkout firefox branch for firefox version).


## Features

- **Quick Navigation:** Jump directly to a website using a simple alias.
- **Wildcard Matching:** Automatically append additional path segments to the base URL.
- **Omnibox Integration:** Use your browser's address bar for easy access.
- **Custom Search Trigger:** Set a custom keyword (e.g., 'search', 'find') to trigger site-specific or global search from the omnibox.
- **Collections:** Group multiple aliases together and open all sites in a collection with a single command.
- **Persistent Storage:** Aliases and collections are stored using the browser's sync storage, making them available across devices.
- **Simple UI:** Add, edit, and delete aliases and collections via a user-friendly popup interface.


## Installation

1. **Clone or Download the Repository:**

   ```bash
   git clone https://github.com/SohamKukreti/URLias.git
   ```

2. **Load the Extension in Your Browser:**

   - **Chrome:**  
     - Open Chrome and navigate to `chrome://extensions/`.
     - Enable "Developer mode" by toggling the switch in the upper right corner.
     - Click "Load unpacked" and select the directory where you cloned/downloaded URLias.
   
   - **Firefox:**  
     - Open Firefox and navigate to `about:debugging#/runtime/this-firefox`.
     - Click "Load Temporary Add-on" and select the `manifest.json` file from the URLias directory.
   
   - **Other Browsers:**  
     Follow your browser's instructions for loading unpacked or temporary extensions.

3. **Set Up Your Aliases and Collections:**

   - Click on the URLias icon to open the popup.
   - Enter an alias and its corresponding URL (e.g., `gh` and `https://github.com`).
   - Save your alias. You can now use the alias directly in your browser's address bar.
   - To create a collection, enter a collection name, add aliases using the tag input, and save. Collections let you open multiple sites at once.
   - You can also set a custom search trigger word in the popup (e.g., 'search', 'find', 'lookup').


## Usage

### Navigating Using Aliases

- In your browser’s address bar, type your alias (e.g., `gh`).
- If you add extra text (e.g., `gh user`), the extension appends the extra text to the saved URL (resulting in `https://github.com/user`).

### Using the Search Trigger

- You can set a custom search trigger word (e.g., `search`, `find`, `lookup`) in the popup.
- To search a site, type: `go <alias> <search trigger> <your query>` (e.g., `go gh search openai`).
- If the alias supports site search, it will use the site’s search; otherwise, it will default to Google search.

### Using Collections

- Create a collection in the popup by entering a collection name and adding aliases.
- To open all sites in a collection, type the collection name in the omnibox (e.g., `go work`). Each site in the collection will open in a new tab.

### Managing Aliases and Collections

- **Adding:** Use the popup form to create a new alias or collection.
- **Editing:** Directly edit the URL in the list. Changes are saved automatically.
- **Deleting:** Click the delete button next to an alias or collection to remove it.

## TODO

1. **Support for Streaming Services:**  
   Enable aliases that take users directly to their favorite movies or TV shows on platforms like Netflix, Hulu, Amazon Prime, etc. For example, allow commands like `netflix movie_name`