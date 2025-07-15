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
    'amazon.in'      : 'https://www.amazon.in/s?k=%s',
    'flipkart.com'   : 'https://www.flipkart.com/search?q=%s',
    'ebay.com'        : 'https://www.ebay.com/sch/i.html?_nkw=%s',
    'walmart.com'     : 'https://www.walmart.com/search/?query=%s',
    'aliexpress.com'  : 'https://www.aliexpress.com/wholesale?SearchText=%s',
    'etsy.com'        : 'https://www.etsy.com/search?q=%s',
    'bestbuy.com'     : 'https://www.bestbuy.com/site/searchpage.jsp?st=%s',
    'target.com'      : 'https://www.target.com/s?searchTerm=%s',
    'myntra.com'           : 'https://www.myntra.com/search?q=%s',
    'ajio.com'             : 'https://www.ajio.com/search/?text=%s',
    'tatacliq.com'         : 'https://www.tatacliq.com/search/?q=%s',
    'bigbasket.com'        : 'https://www.bigbasket.com/ps/?q=%s',
    'jiomart.com'          : 'https://www.jiomart.com/search/%s',
    'snapdeal.com'         : 'https://www.snapdeal.com/search?keyword=%s',
    'reliancedigital.in'   : 'https://www.reliancedigital.in/search?q=%s',
    'nykaa.com'            : 'https://www.nykaa.com/search/result/?q=%s',
  
    /* Travel & maps */
    'maps.google.com' : 'https://www.google.com/maps/search/%s',
    'tripadvisor.com' : 'https://www.tripadvisor.com/Search?q=%s',
    'booking.com'     : 'https://www.booking.com/searchresults.en-gb.html?ss=%s',
    'makemytrip.com'       : 'https://www.makemytrip.com/routeplanner/?searchText=%s',
    'goibibo.com'          : 'https://www.goibibo.com/travel/search?searchText=%s',
    'yatra.com'            : 'https://www.yatra.com/hotels/search?query=%s',
    'redbus.in'            : 'https://www.redbus.in/search?q=%s',
  
    /* Entertainment */
    'imdb.com'        : 'https://www.imdb.com/find?q=%s',
    'pinterest.com'   : 'https://www.pinterest.com/search/pins/?q=%s',
    'medium.com'      : 'https://medium.com/search?q=%s',
    'quora.com'       : 'https://www.quora.com/search?q=%s',
  
    /* News */
    'nytimes.com'     : 'https://www.nytimes.com/search?query=%s',
    'bbc.co.uk'       : 'https://www.bbc.co.uk/search?q=%s',
    'cnn.com'         : 'https://edition.cnn.com/search?q=%s',
    
    /* Food & delivery */
    'swiggy.com'           : 'https://www.swiggy.com/search?query=%s',
    'zomato.com'           : 'https://www.zomato.com/search?keyword=%s',

    /*  ➜ news & media */
    'timesofindia.indiatimes.com' : 'https://timesofindia.indiatimes.com/topic/%s',
    'ndtv.com'                    : 'https://www.ndtv.com/topic/%s',
    'indianexpress.com'           : 'https://indianexpress.com/?s=%s',
    'hindustantimes.com'          : 'https://www.hindustantimes.com/search?keyword=%s',
    'thehindu.com'                : 'https://www.thehindu.com/search/?q=%s',

    /*  ➜ sports & cricket */
    'cricbuzz.com'        : 'https://www.cricbuzz.com/search?q=%s',
    'espncricinfo.com'    : 'https://search.espncricinfo.com/ci/content/site/search.html?search=%s',

    /*  ➜ finance & markets */
    'moneycontrol.com'    : 'https://www.moneycontrol.com/search.php?type=1&searchstr=%s',
    'economictimes.indiatimes.com' : 'https://economictimes.indiatimes.com/topic/%s',

    /*  ➜ jobs & careers */
    'naukri.com'          : 'https://www.naukri.com/%s-jobs',

    /*  ➜ tech / learning */
    'geeksforgeeks.org'   : 'https://www.geeksforgeeks.org/search/?gq=%s',

    /*  ➜ OTT / streaming */
    'hotstar.com'         : 'https://www.hotstar.com/in/search?q=%s',
    'sonyliv.com'         : 'https://www.sonyliv.com/search?q=%s',
    'zee5.com'            : 'https://www.zee5.com/search?q=%s',
    'gaana.com'           : 'https://gaana.com/search/%s'
  });
  
  export const defaultAliases = {
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
    "sp": "https://spotify.com",
    "fk":   "https://flipkart.com",
    "cg": "https://chatgpt.com/"
  };
