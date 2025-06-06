# URLias

<img src="assets/icon128.png" width="100" align="center" alt="URLias Icon">


URLias is a browser extension that lets you quickly navigate to your favorite websites using simple aliases. By typing a predefined alias (like `gh`) in your browser's address bar, you can instantly jump to the corresponding URL (e.g., `https://github.com`). It even supports wildcard matching, so if you type an alias followed by extra text (for example, `gh user`), URLias will automatically append the extra text as a new path segment (resulting in `https://github.com/user`).

Currently Supports firefox and chromium based browsers (checkout firefox branch for firefox version).

[Add it to firefox](https://addons.mozilla.org/en-US/firefox/addon/urlias/)

## Features

- **Quick Navigation:** Jump directly to a website using a simple alias.
- **Wildcard Matching:** Automatically append additional path segments to the base URL.
- **Omnibox Integration:** Use your browser's address bar for easy access.
- **Persistent Storage:** Aliases are stored using the browser's sync storage, making them available across devices.
- **Simple UI:** Add, edit, and delete aliases via a user-friendly popup interface.

## Usage

1. **Navigating Using Aliases:**

- In your browser’s address bar, type your alias:

- `go <alias name>`

- Example usage:

- `go gh` -> https://github.com/

- If you add extra text (e.g., `go gh user`), the extension appends the extra text to the saved URL (resulting in `https://github.com/user`)

2. **Managing Aliases:**

   - **Adding:** Use the popup form to create a new alias.
   - **Editing:** Directly edit the URL in the list. Changes are saved automatically.
   - **Deleting:** Click the delete button next to an alias to remove it.

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

3. **Set Up Your Aliases:**

   - Click on the URLias icon to open the popup.
   - Enter an alias and its corresponding URL (e.g., `gh` and `https://github.com`).
   - Save your alias. You can now use the alias directly in your browser's address bar.

## TODO

1. **Support for Streaming Services:**  
   Enable aliases that take users directly to their favorite movies or TV shows on platforms like Netflix, Hulu, Amazon Prime, etc. For example, allow commands like `netflix movie_name` to take you directly to a movie's page.

2. **Advanced URL Parameter Customization:**  
   Allow users to define more complex URL patterns with multiple parameters, making it easier to navigate dynamically constructed URLs.

3. **Bookmarks Integration (maybe):**  
   Offer an option to include bookmarks so users can quickly navigate to saved sites and even integrate bookmarks into the alias system.


## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Commit your changes with a clear message.
4. Submit a pull request with a description of your changes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
