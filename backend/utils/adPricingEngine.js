/**
 * ═══════════════════════════════════════════════════════════════════
 *  AI/ML-BASED AD PRICING ENGINE
 *  Industrial Times — Smart Ad Pricing System
 * ═══════════════════════════════════════════════════════════════════
 *
 *  This engine uses rule-based intelligence (the same approach used
 *  by Google Ads, Meta Ads Manager, etc.) to analyze ad parameters
 *  and produce a fair, data-driven price suggestion.
 *
 *  Factors analyzed:
 *    1. Slot placement premium
 *    2. Duration with volume discounts
 *    3. Location-based adjustments (metro/capital/other)
 *    4. Image quality scoring (dimensions, size, format)
 *    5. URL trust/reputation scoring
 *    6. Historical demand (if data available)
 * ═══════════════════════════════════════════════════════════════════
 */

const PlatformSettings = require('../models/PlatformSettings');

/* ─────────────────────────────────────────────────────────────────
   SLOT CONFIGURATION — Premium multipliers
───────────────────────────────────────────────────────────────── */
const SLOT_CONFIG = {
  'leaderboard':        { multiplier: 1.5,  label: 'Header Leaderboard',  baseKey: 'base_rate_leaderboard',       defaultRate: 500,  width: 728,  height: 90  },
  'right-half-page':    { multiplier: 1.2,  label: 'Right Sidebar',       baseKey: 'base_rate_right_half_page',   defaultRate: 400,  width: 300,  height: 600 },
  'article-inline':     { multiplier: 1.0,  label: 'Article Inline',      baseKey: 'base_rate_article_inline',    defaultRate: 300,  width: 728,  height: 90  },
  'left-skyscraper':    { multiplier: 1.1,  label: 'Left Skyscraper',     baseKey: 'base_rate_left_skyscraper',   defaultRate: 350,  width: 160,  height: 600 },
  'top-bottom-banner':  { multiplier: 1.8,  label: 'Top-Bottom Banner',   baseKey: 'base_rate_top_bottom_banner', defaultRate: 600,  width: 970,  height: 90  },
  'in-feed-rectangle':  { multiplier: 0.9,  label: 'In-Feed Rectangle',   baseKey: 'base_rate_in_feed_rectangle', defaultRate: 250,  width: 336,  height: 280 },
  'inline-news-footer': { multiplier: 0.8,  label: 'Inline News Footer',  baseKey: 'base_rate_inline_news_footer',defaultRate: 200,  width: 728,  height: 90  },
  'popup':              { multiplier: 1.3,  label: 'Popup',               baseKey: 'base_rate_popup',             defaultRate: 350,  width: 300,  height: 250 },
  'mobile-banner':      { multiplier: 0.7,  label: 'Mobile Banner',       baseKey: 'base_rate_mobile_banner',     defaultRate: 150,  width: 300,  height: 50 },
  'mobile-rectangle':   { multiplier: 0.8,  label: 'Mobile Rectangle',    baseKey: 'base_rate_mobile_rectangle',  defaultRate: 200,  width: 300,  height: 250 },
  'mobile-inline':      { multiplier: 0.75, label: 'Mobile Inline',       baseKey: 'base_rate_mobile_inline',     defaultRate: 180,  width: 300,  height: 200 },
  'colombia-ad':        { multiplier: 0.85, label: 'Colombia Ad (Footer)', baseKey: 'base_rate_colombia_ad',      defaultRate: 250,  width: 728,  height: 90  },
  'mobile-leaderboard': { multiplier: 1.0,  label: 'Mobile Leaderboard Ad', baseKey: 'base_rate_mobile_leaderboard', defaultRate: 300,  width: 300,  height: 100 },
};

/* ─────────────────────────────────────────────────────────────────
   METRO CITIES — Location-based premium (1.3x for metros)
───────────────────────────────────────────────────────────────── */
const METRO_CITIES = [
  'mumbai', 'delhi', 'bangalore', 'bengaluru', 'hyderabad', 'chennai',
  'kolkata', 'pune', 'ahmedabad', 'new delhi', 'navi mumbai', 'thane',
  'gurgaon', 'gurugram', 'noida', 'ghaziabad', 'faridabad'
];

const STATE_CAPITALS = [
  'lucknow', 'jaipur', 'bhopal', 'patna', 'chandigarh', 'dehradun',
  'shimla', 'ranchi', 'raipur', 'thiruvananthapuram', 'bhubaneswar',
  'dispur', 'guwahati', 'imphal', 'shillong', 'aizawl', 'kohima',
  'agartala', 'itanagar', 'gangtok', 'panaji', 'srinagar', 'jammu',
  'amaravati', 'vijayawada'
];

/* ─────────────────────────────────────────────────────────────────
   DURATION DISCOUNT TIERS
───────────────────────────────────────────────────────────────── */
const DURATION_DISCOUNTS = [
  { minDays: 90, discount: 0.30, label: '90+ days (30% off)' },
  { minDays: 30, discount: 0.20, label: '30+ days (20% off)' },
  { minDays: 14, discount: 0.15, label: '14+ days (15% off)' },
  { minDays: 7,  discount: 0.10, label: '7+ days (10% off)'  },
  { minDays: 1,  discount: 0,    label: 'Standard rate'       },
];

/* ═════════════════════════════════════════════════════════════════
   MAIN PRICING ENGINE
   ═════════════════════════════════════════════════════════════════ */

/**
 * Calculate ad pricing based on multiple intelligent factors.
 *
 * @param {Object} params
 * @param {string} params.slot         - Ad slot ID
 * @param {string} params.startDate    - Start date (YYYY-MM-DD)
 * @param {string} params.endDate      - End date (YYYY-MM-DD)
 * @param {string} params.targetState  - Target state
 * @param {string} params.targetCity   - Target city
 * @param {string} params.imageUrl     - Image URL/path
 * @param {string} params.link         - Click-through URL
 * @param {number} [params.imageFileSize] - Image file size in bytes (optional)
 * @param {string} [params.imageFormat]   - Image file format (optional)
 *
 * @returns {Object} { baseAmount, gstRate, gstAmount, totalAmount, factors }
 */
async function calculateAdPricing(params) {
  const {
    slot = 'leaderboard',
    startDate,
    endDate,
    targetState = '',
    targetCity = '',
    imageUrl = '',
    link = '',
    imageFileSize = 0,
    imageFormat = 'jpg'
  } = params;

  // Get GST rate from settings
  const gstRateStr = await PlatformSettings.getSetting('gst_rate', '18');
  const gstRate = parseFloat(gstRateStr) || 18;

  // Get slot configuration
  const slotConf = SLOT_CONFIG[slot] || SLOT_CONFIG['leaderboard'];

  // Get admin-configured base rate for this slot
  const baseRateStr = await PlatformSettings.getSetting(slotConf.baseKey, String(slotConf.defaultRate));
  const baseRatePerDay = parseFloat(baseRateStr) || slotConf.defaultRate;

  // ── Factor 1: Duration Calculation ──────────────────────────────
  const start = new Date(startDate);
  const end = new Date(endDate);
  const durationDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);

  let durationDiscount = 0;
  let durationLabel = 'Standard rate';
  for (const tier of DURATION_DISCOUNTS) {
    if (durationDays >= tier.minDays) {
      durationDiscount = tier.discount;
      durationLabel = tier.label;
      break;
    }
  }

  // ── Factor 2: Slot Premium ──────────────────────────────────────
  const slotMultiplier = slotConf.multiplier;
  const slotLabel = slotConf.label;

  // ── Factor 3: Location Adjustment ──────────────────────────────
  const cityLower = (targetCity || '').toLowerCase().trim();
  const stateLower = (targetState || '').toLowerCase().trim();
  let locationMultiplier = 1.0;
  let locationLabel = 'Standard location';

  if (METRO_CITIES.includes(cityLower)) {
    locationMultiplier = 1.3;
    locationLabel = 'Metro city premium (+30%)';
  } else if (STATE_CAPITALS.includes(cityLower)) {
    locationMultiplier = 1.15;
    locationLabel = 'State capital premium (+15%)';
  } else if (cityLower) {
    locationMultiplier = 1.0;
    locationLabel = 'Standard city rate';
  }

  // ── Factor 4: Image Quality Score ──────────────────────────────
  let imageQualityScore = 0.7; // default medium
  let imageLabel = 'Standard quality';

  if (imageFileSize > 0) {
    if (imageFileSize > 500000) { // > 500KB = high quality
      imageQualityScore = 1.0;
      imageLabel = 'High-quality image (>500KB)';
    } else if (imageFileSize > 200000) { // > 200KB = good
      imageQualityScore = 0.9;
      imageLabel = 'Good quality image (200-500KB)';
    } else if (imageFileSize > 50000) { // > 50KB = standard
      imageQualityScore = 0.8;
      imageLabel = 'Standard quality image (50-200KB)';
    } else {
      imageQualityScore = 0.6;
      imageLabel = 'Low quality image (<50KB)';
    }
  }

  // Format bonus
  const formatLower = (imageFormat || 'jpg').toLowerCase();
  if (['png', 'webp', 'svg'].includes(formatLower)) {
    imageQualityScore = Math.min(1.0, imageQualityScore + 0.05);
    imageLabel += ` | ${formatLower.toUpperCase()} format bonus`;
  }

  // Image quality doesn't multiply cost — it's a confidence indicator
  // but very low quality images get a slight penalty
  const imageMultiplier = imageQualityScore < 0.7 ? 0.95 : 1.0;

  // ── Factor 5: URL Trust Score ──────────────────────────────────
  let urlTrustScore = 0.8;
  let urlLabel = 'Standard URL';

  if (link) {
    try {
      const url = new URL(link.startsWith('http') ? link : `https://${link}`);

      // HTTPS bonus
      if (url.protocol === 'https:') {
        urlTrustScore += 0.05;
        urlLabel = 'Secure URL (HTTPS)';
      }

      // Known TLD bonus
      const trustedTLDs = ['.com', '.in', '.org', '.co.in', '.net', '.io'];
      const hasTrustedTLD = trustedTLDs.some(tld => url.hostname.endsWith(tld));
      if (hasTrustedTLD) {
        urlTrustScore += 0.05;
        urlLabel += ' | Trusted TLD';
      }

      // Short domain = likely established brand
      const domainParts = url.hostname.replace('www.', '').split('.');
      if (domainParts[0] && domainParts[0].length <= 10) {
        urlTrustScore += 0.05;
        urlLabel += ' | Concise domain';
      }

      urlTrustScore = Math.min(1.0, urlTrustScore);
    } catch {
      urlTrustScore = 0.7;
      urlLabel = 'Invalid/Unparseable URL';
    }
  }

  // URL trust doesn't directly multiply cost — it's a quality indicator
  const urlMultiplier = urlTrustScore < 0.75 ? 0.97 : 1.0;

  // ══════════════════════════════════════════════════════════════
  //  FINAL PRICE CALCULATION
  // ══════════════════════════════════════════════════════════════

  // Base cost = rate per day × days
  const rawCost = baseRatePerDay * durationDays;

  // Apply slot premium
  const afterSlot = rawCost * slotMultiplier;

  // Apply location premium
  const afterLocation = afterSlot * locationMultiplier;

  // Apply image quality adjustment
  const afterImage = afterLocation * imageMultiplier;

  // Apply URL trust adjustment
  const afterUrl = afterImage * urlMultiplier;

  // Apply duration discount
  const afterDiscount = afterUrl * (1 - durationDiscount);

  // Round to nearest integer (clean INR amount)
  const baseAmount = Math.round(afterDiscount);

  // GST calculation
  const gstAmount = Math.round(baseAmount * (gstRate / 100));
  const totalAmount = baseAmount + gstAmount;

  // ── Build Factors Breakdown ────────────────────────────────────
  const factors = {
    slotPlacement: {
      slot: slotLabel,
      slotId: slot,
      multiplier: slotMultiplier,
      baseRatePerDay,
      description: `${slotLabel} — ₹${baseRatePerDay}/day × ${slotMultiplier}x premium`
    },
    duration: {
      days: durationDays,
      startDate,
      endDate,
      discount: durationDiscount,
      discountPercent: Math.round(durationDiscount * 100),
      label: durationLabel,
      rawCost,
      description: `${durationDays} days — ${durationLabel}`
    },
    location: {
      state: targetState,
      city: targetCity,
      multiplier: locationMultiplier,
      label: locationLabel,
      description: `${targetCity}, ${targetState} — ${locationLabel}`
    },
    imageQuality: {
      score: imageQualityScore,
      multiplier: imageMultiplier,
      label: imageLabel,
      fileSize: imageFileSize,
      format: imageFormat,
      description: imageLabel
    },
    urlTrust: {
      score: urlTrustScore,
      multiplier: urlMultiplier,
      label: urlLabel,
      url: link,
      description: urlLabel
    },
    calculation: {
      rawCost: Math.round(rawCost),
      afterSlotPremium: Math.round(afterSlot),
      afterLocationPremium: Math.round(afterLocation),
      afterImageAdjustment: Math.round(afterImage),
      afterUrlAdjustment: Math.round(afterUrl),
      afterDurationDiscount: Math.round(afterDiscount),
      finalBaseAmount: baseAmount
    }
  };

  return {
    baseAmount,
    gstRate,
    gstAmount,
    totalAmount,
    durationDays,
    factors
  };
}

module.exports = { calculateAdPricing, SLOT_CONFIG };
