import { Category } from './types';

/**
 * Domain patterns for automatic categorization
 */
const CATEGORY_PATTERNS: Record<Category, RegExp[]> = {
  social: [
    /facebook\.com/i,
    /twitter\.com/i,
    /x\.com/i,
    /reddit\.com/i,
    /instagram\.com/i,
    /linkedin\.com/i,
    /tiktok\.com/i,
    /snapchat\.com/i,
    /pinterest\.com/i,
    /tumblr\.com/i,
    /discord\.com/i,
    /discord\.gg/i,
    /threads\.net/i,
    /mastodon\./i,
    /bsky\.app/i,
  ],
  news: [
    /cnn\.com/i,
    /bbc\.com/i,
    /bbc\.co\.uk/i,
    /nytimes\.com/i,
    /reuters\.com/i,
    /apnews\.com/i,
    /news\.google\.com/i,
    /theguardian\.com/i,
    /washingtonpost\.com/i,
    /foxnews\.com/i,
    /nbcnews\.com/i,
    /abcnews\.go\.com/i,
    /cbsnews\.com/i,
    /huffpost\.com/i,
    /npr\.org/i,
    /wsj\.com/i,
    /bloomberg\.com/i,
    /cnbc\.com/i,
    /techcrunch\.com/i,
    /theverge\.com/i,
    /arstechnica\.com/i,
    /wired\.com/i,
    /news\./i,
  ],
  shopping: [
    /amazon\./i,
    /ebay\.com/i,
    /walmart\.com/i,
    /target\.com/i,
    /etsy\.com/i,
    /shopify\.com/i,
    /bestbuy\.com/i,
    /costco\.com/i,
    /homedepot\.com/i,
    /lowes\.com/i,
    /wayfair\.com/i,
    /aliexpress\.com/i,
    /alibaba\.com/i,
    /wish\.com/i,
    /newegg\.com/i,
    /overstock\.com/i,
    /shop\./i,
    /store\./i,
    /cart/i,
    /checkout/i,
  ],
  development: [
    /github\.com/i,
    /gitlab\.com/i,
    /bitbucket\.org/i,
    /stackoverflow\.com/i,
    /stackexchange\.com/i,
    /dev\.to/i,
    /medium\.com/i,
    /hashnode\.com/i,
    /npmjs\.com/i,
    /pypi\.org/i,
    /crates\.io/i,
    /docs\./i,
    /developer\./i,
    /api\./i,
    /console\.cloud/i,
    /vercel\.com/i,
    /netlify\.com/i,
    /heroku\.com/i,
    /aws\.amazon\.com/i,
    /cloud\.google\.com/i,
    /azure\.microsoft\.com/i,
    /digitalocean\.com/i,
    /codepen\.io/i,
    /jsfiddle\.net/i,
    /codesandbox\.io/i,
    /replit\.com/i,
    /cursor\.com/i,
    /anthropic\.com/i,
    /openai\.com/i,
    /huggingface\.co/i,
  ],
  entertainment: [
    /youtube\.com/i,
    /youtu\.be/i,
    /netflix\.com/i,
    /spotify\.com/i,
    /twitch\.tv/i,
    /hulu\.com/i,
    /disneyplus\.com/i,
    /hbomax\.com/i,
    /max\.com/i,
    /primevideo\.com/i,
    /crunchyroll\.com/i,
    /soundcloud\.com/i,
    /vimeo\.com/i,
    /dailymotion\.com/i,
    /pandora\.com/i,
    /deezer\.com/i,
    /tidal\.com/i,
    /imdb\.com/i,
    /rottentomatoes\.com/i,
    /metacritic\.com/i,
    /ign\.com/i,
    /gamespot\.com/i,
    /kotaku\.com/i,
    /polygon\.com/i,
    /steam/i,
    /twitch/i,
  ],
  productivity: [
    /docs\.google\.com/i,
    /drive\.google\.com/i,
    /sheets\.google\.com/i,
    /slides\.google\.com/i,
    /notion\.so/i,
    /notion\.site/i,
    /trello\.com/i,
    /asana\.com/i,
    /monday\.com/i,
    /clickup\.com/i,
    /slack\.com/i,
    /teams\.microsoft\.com/i,
    /zoom\.us/i,
    /figma\.com/i,
    /canva\.com/i,
    /miro\.com/i,
    /airtable\.com/i,
    /dropbox\.com/i,
    /box\.com/i,
    /evernote\.com/i,
    /todoist\.com/i,
    /calendar\./i,
    /meet\.google\.com/i,
    /webex\.com/i,
  ],
  reference: [
    /wikipedia\.org/i,
    /wikimedia\.org/i,
    /britannica\.com/i,
    /dictionary\.com/i,
    /merriam-webster\.com/i,
    /thesaurus\.com/i,
    /translate\.google\.com/i,
    /wolframalpha\.com/i,
    /quora\.com/i,
    /answers\.com/i,
    /howstuffworks\.com/i,
    /investopedia\.com/i,
    /healthline\.com/i,
    /webmd\.com/i,
    /mayoclinic\.org/i,
    /khanacademy\.org/i,
    /coursera\.org/i,
    /udemy\.com/i,
    /edx\.org/i,
    /skillshare\.com/i,
    /wiki\./i,
  ],
  email: [
    /mail\.google\.com/i,
    /gmail\.com/i,
    /outlook\.live\.com/i,
    /outlook\.office\.com/i,
    /mail\.yahoo\.com/i,
    /protonmail\.com/i,
    /proton\.me\/mail/i,
    /fastmail\.com/i,
    /zoho\.com\/mail/i,
    /icloud\.com\/mail/i,
    /superhuman\.com/i,
    /mail\./i,
    /webmail\./i,
    /inbox/i,
  ],
  other: [], // Default fallback
};

/**
 * Title keywords for additional categorization hints
 */
const TITLE_KEYWORDS: Record<Category, string[]> = {
  social: ['post', 'tweet', 'feed', 'profile', 'follow', 'share', 'comment', 'like'],
  news: ['breaking', 'headline', 'article', 'report', 'latest', 'update', 'opinion', 'editorial'],
  shopping: ['buy', 'cart', 'checkout', 'order', 'price', 'sale', 'discount', 'product', 'shipping'],
  development: ['code', 'programming', 'developer', 'api', 'documentation', 'repository', 'commit', 'pull request', 'issue', 'bug'],
  entertainment: ['watch', 'video', 'movie', 'music', 'song', 'playlist', 'stream', 'episode', 'season', 'game'],
  productivity: ['document', 'spreadsheet', 'presentation', 'meeting', 'task', 'project', 'workspace', 'collaborate'],
  reference: ['wiki', 'definition', 'meaning', 'learn', 'course', 'tutorial', 'guide', 'how to'],
  email: ['inbox', 'compose', 'sent', 'draft', 'unread', 'message'],
  other: [],
};

/**
 * Finance-related patterns (subcategory of 'other' for now, but could be separate)
 */
const FINANCE_PATTERNS: RegExp[] = [
  /robinhood\.com/i,
  /fidelity\.com/i,
  /schwab\.com/i,
  /vanguard\.com/i,
  /etrade\.com/i,
  /tdameritrade\.com/i,
  /coinbase\.com/i,
  /binance\.com/i,
  /kraken\.com/i,
  /finance\.yahoo\.com/i,
  /investing\.com/i,
  /marketwatch\.com/i,
  /seekingalpha\.com/i,
  /morningstar\.com/i,
  /investor\./i,
  /trading/i,
  /stock/i,
  /crypto/i,
  /bank\./i,
  /chase\.com/i,
  /wellsfargo\.com/i,
  /bankofamerica\.com/i,
  /capitalone\.com/i,
  /paypal\.com/i,
  /venmo\.com/i,
  /stripe\.com/i,
  /ramp\.com/i,
  /brex\.com/i,
  /mint\.com/i,
  /ynab\.com/i,
  /quickbooks/i,
  /ir\./i,  // investor relations
  /investor-relations/i,
  /earnings/i,
  /quarterly/i,
  /fiscal/i,
];

/**
 * Categorizes a URL and title into a category
 */
export function categorize(url: string, title: string = ''): Category {
  const lowerUrl = url.toLowerCase();
  const lowerTitle = title.toLowerCase();

  // Check finance patterns first (maps to 'other' but good for debugging)
  // In future could be its own category
  for (const pattern of FINANCE_PATTERNS) {
    if (pattern.test(lowerUrl)) {
      // For now, categorize finance as 'other' since it's not in our main categories
      // But we could add 'finance' as a category later
      return 'shopping'; // Closest match - financial services often involve transactions
    }
  }

  // Check each category's URL patterns
  for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS) as [Category, RegExp[]][]) {
    if (category === 'other') continue;

    for (const pattern of patterns) {
      if (pattern.test(lowerUrl)) {
        return category;
      }
    }
  }

  // If no URL match, check title keywords
  for (const [category, keywords] of Object.entries(TITLE_KEYWORDS) as [Category, string[]][]) {
    if (category === 'other') continue;

    for (const keyword of keywords) {
      if (lowerTitle.includes(keyword)) {
        return category;
      }
    }
  }

  // Default to 'other'
  return 'other';
}

/**
 * Batch categorize multiple entries
 */
export function categorizeEntries(
  entries: Array<{ url: string; title?: string }>
): Category[] {
  return entries.map(entry => categorize(entry.url, entry.title || ''));
}
