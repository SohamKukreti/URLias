// builtIns.js
export const BUILTIN_SEARCH_TPL = Object.freeze({
    /* Search engines */
    'google.com'      : 'https://www.google.com/search?q=%s',
    'bing.com'        : 'https://www.bing.com/search?q=%s',
    'duckduckgo.com'  : 'https://duckduckgo.com/?q=%s',
  
    /* Knowledge & reference */
    'wikipedia.org'   : 'https://en.wikipedia.org/wiki/Special:Search?search=%s',
    'wiktionary.org'  : 'https://en.wiktionary.org/w/index.php?search=%s',
    'britannica.com'  : 'https://www.britannica.com/search?query=%s',
  
    /* Developer hubs */
    'stackoverflow.com': 'https://stackoverflow.com/search?q=%s',
    'github.com'       : 'https://github.com/search?q=%s&type=repositories',
    'gitlab.com'       : 'https://gitlab.com/search?search=%s',
  
    /* Social & community */
    'twitter.com'     : 'https://twitter.com/search?q=%s',          // :contentReference[oaicite:0]{index=0}
    'reddit.com'      : 'https://www.reddit.com/search/?q=%s',
    'linkedin.com'    : 'https://www.linkedin.com/search/results/all/?keywords=%s',
    'facebook.com'    : 'https://www.facebook.com/search/top/?q=%s',
    'instagram.com'   : 'https://www.instagram.com/explore/tags/%s',
  
    /* Video / audio */
    'youtube.com'     : 'https://www.youtube.com/results?search_query=%s',
    'vimeo.com'       : 'https://vimeo.com/search?q=%s',
    'dailymotion.com' : 'https://www.dailymotion.com/search/%s',
    'spotify.com'     : 'https://open.spotify.com/search/%s',
    'soundcloud.com'  : 'https://soundcloud.com/search?q=%s',
  
    /* Shopping */
    'amazon.com'      : 'https://www.amazon.com/s?k=%s',
    'ebay.com'        : 'https://www.ebay.com/sch/i.html?_nkw=%s',
    'walmart.com'     : 'https://www.walmart.com/search/?query=%s',
    'aliexpress.com'  : 'https://www.aliexpress.com/wholesale?SearchText=%s',
    'etsy.com'        : 'https://www.etsy.com/search?q=%s',
    'bestbuy.com'     : 'https://www.bestbuy.com/site/searchpage.jsp?st=%s',
    'target.com'      : 'https://www.target.com/s?searchTerm=%s',
  
    /* Travel & maps */
    'maps.google.com' : 'https://www.google.com/maps/search/%s',
    'tripadvisor.com' : 'https://www.tripadvisor.com/Search?q=%s',
    'booking.com'     : 'https://www.booking.com/searchresults.en-gb.html?ss=%s',
  
    /* Entertainment */
    'imdb.com'        : 'https://www.imdb.com/find?q=%s',
    'pinterest.com'   : 'https://www.pinterest.com/search/pins/?q=%s',
    'medium.com'      : 'https://medium.com/search?q=%s',
    'quora.com'       : 'https://www.quora.com/search?q=%s',
  
    /* News */
    'nytimes.com'     : 'https://www.nytimes.com/search?query=%s',
    'bbc.co.uk'       : 'https://www.bbc.co.uk/search?q=%s',
    'cnn.com'         : 'https://edition.cnn.com/search?q=%s'
  });
  