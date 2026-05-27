const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Ad = sequelize.define('Ad', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  // ── Position / Slot ───────────────────────────────────────────
  slot: {
    type: DataTypes.ENUM(
      'leaderboard',        // 728 × 90  — top of page
      'left-skyscraper',   // 160 × 600 — left sidebar
      'right-half-page',   // 300 × 600 — right sidebar
      'popup',             // legacy popup slot
      'article-inline',    // 728 × 90  — inline within articles
      'top-bottom-banner', // 970 × 90  — large horizontal banner
      'in-feed-rectangle', // 336 × 280 — inline within news feed grids
      'inline-news-footer', // 728 × 90  — inline at bottom of news articles
      'mobile-banner',     // 300 × 100
      'mobile-rectangle',  // 300 × 250
      'mobile-inline'      // 300 × 200
    ),
    allowNull: false,
    defaultValue: 'leaderboard'
  },
  // ── Dimensions (auto-set, not editable by admin) ──────────────
  width: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 728
  },
  height: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 90
  },
  // ── Creative ──────────────────────────────────────────────────
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: false
  },
  link: {
    type: DataTypes.STRING,
    allowNull: true
  },
  label: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Advertisement'
  },
  advertiser: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
  },
  // ── Google Ad & UI Indicators ─────────────────────────────────
  isGoogleAd: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  googleAdCode: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isSponsored: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // ── Targeting ─────────────────────────────────────────────────
  category: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null   // null = global (all pages)
  },
  targetState: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null
  },
  targetCity: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null
  },
  // ── Schedule ──────────────────────────────────────────────────
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    defaultValue: null
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    defaultValue: null
  },
  // ── Status & Metrics ──────────────────────────────────────────
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  impressions: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  clicks: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  // ── Legacy type field (kept for backward compat) ──────────────
  type: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

module.exports = Ad;
