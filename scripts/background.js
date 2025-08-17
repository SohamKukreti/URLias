import {getMostFrequentlyUsedAliases, getSortedAliases, handleAlias, handleCollection, loadStorageData } from "./utility.js";

  // Debounce function for omnibox suggestions
  let suggestionTimeout = null;
  const SUGGESTION_DELAY = 150; // milliseconds

/* ---------- entry point for the extension ---------- */

// Handle omnibox suggestions

chrome.omnibox.onInputChanged.addListener((text, suggest) => {
  // Clear previous timeout
  if (suggestionTimeout) {
    clearTimeout(suggestionTimeout);
  }
  
  // Debounce suggestions to reduce processing
  suggestionTimeout = setTimeout(async () => {
    try {
      const { aliases, collections, aliasUsage } = await loadStorageData();
      
      const suggestions = [];
      const searchTerm = text.toLowerCase().trim();
      
      if (searchTerm === "") {
        // When user types "go" (empty search term), show most frequently used aliases first
        const mostUsedAliases = getMostFrequentlyUsedAliases(aliases, aliasUsage, 5);
        
        // Add most frequently used aliases first
        for (const aliasData of mostUsedAliases) {
          suggestions.push({
            content: `${aliasData.name}`,
            description: `${aliasData.name} → ${aliasData.url} (used ${aliasData.usage} times)`
          });
        }
        
        // Add remaining aliases
        for (const [alias, url] of Object.entries(aliases)) {
          if (!mostUsedAliases.find(a => a.name === alias)) {
            suggestions.push({
              content: `${alias}`,
              description: `${alias} → ${url}`
            });
          }
        }
        
        // Add collections
        for (const [collectionName, aliasesStr] of Object.entries(collections)) {
          const aliasList = aliasesStr.split(',').slice(0, 3).join(', ');
          const moreText = aliasesStr.split(',').length > 3 ? '...' : '';
          suggestions.push({
            content: `${collectionName}`,
            description: `Collection: ${collectionName} (${aliasList}${moreText})`
          });
        }
      } else {
        // When user types something, show matching aliases and collections
        // Use pre-computed sorted aliases for better performance
        const sortedAliases = getSortedAliases(aliases, aliasUsage);
        
        for (const { alias, url, usage: usageCount } of sortedAliases) {
          if (alias.toLowerCase().includes(searchTerm)) {
            const description = usageCount > 0 
              ? `${alias} → ${url} (used ${usageCount} times)`
              : `${alias} → ${url}`;
            
            suggestions.push({
              content: `${alias}`,
              description: description
            });
          }
        }
        
        for (const [collectionName, aliasesStr] of Object.entries(collections)) {
          if (collectionName.toLowerCase().includes(searchTerm)) {
            const aliasList = aliasesStr.split(',').slice(0, 3).join(', ');
            const moreText = aliasesStr.split(',').length > 3 ? '...' : '';
            suggestions.push({
              content: `${collectionName}`,
              description: `Collection: ${collectionName} (${aliasList}${moreText})`
            });
          }
        }
      }
      
      // Limit suggestions to 10 items
      suggest(suggestions.slice(0, 10));
    } catch (error) {
      console.error("Error generating suggestions:", error);
      suggest([]);
    }
  }, SUGGESTION_DELAY);
});

chrome.omnibox.onInputEntered.addListener(async (text) => {
  try {
    const { aliases, searchTrigger, collections } = await loadStorageData();
    
    chrome.windows.getCurrent((currentWindow) => {
      const windowId = currentWindow.id;
      const parts = text.trim().split(/\s+/);
      const aliasKey = parts[0];
      
      if (aliases[aliasKey]) {
        handleAlias(text, aliases, searchTrigger, true, windowId);
      } else if (collections[aliasKey]) {
        handleCollection(collections[aliasKey], aliases, searchTrigger, windowId);
      } else {
        handleAlias(text, aliases, searchTrigger, true, windowId);
      }
    });
  } catch (error) {
    console.error("Error handling omnibox input:", error);
  }
});