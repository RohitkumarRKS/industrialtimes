const express = require('express');
const cors = require('cors');
const path = require('path');
const { Op } = require('sequelize');
const sequelize = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const articleRoutes = require('./routes/articleRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const adRoutes = require('./routes/adRoutes');
const podcastRoutes = require('./routes/podcastRoutes');
const membershipRoutes = require('./routes/membershipRoutes');
const planRoutes = require('./routes/planRoutes');
const adRequestRoutes = require('./routes/adRequestRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const adPricingRoutes = require('./routes/adPricingRoutes');
const revenueRoutes = require('./routes/revenueRoutes');
const withdrawalRoutes = require('./routes/withdrawalRoutes');
const platformSettingsRoutes = require('./routes/platformSettingsRoutes');
const adAreaPricingRoutes = require('./routes/adAreaPricingRoutes');
const userManagementRoutes = require('./routes/userManagementRoutes');
const webinarRoutes = require('./routes/webinarRoutes');
const promoCodeRoutes = require('./routes/promoCodeRoutes');

// Load env vars
require('dotenv').config({ path: path.join(__dirname, '.env') });

// ─── GLOBAL CRASH PROTECTION: Prevent process from dying on unhandled errors ───
process.on('uncaughtException', (err) => {
  console.error('🔴 UNCAUGHT EXCEPTION (process kept alive):', err.message);
  console.error(err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🔴 UNHANDLED REJECTION (process kept alive):', reason);
});

const app = express();
app.set('trust proxy', true); // Trust reverse proxy headers (e.g. Nginx, Cloudflare)
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── www → non-www 301 redirect (fixes duplicate canonical in Google Search Console) ───
app.use((req, res, next) => {
  const host = req.headers.host || '';
  if (host.startsWith('www.')) {
    const newHost = host.replace(/^www\./, '');
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    return res.redirect(301, `${protocol}://${newHost}${req.originalUrl}`);
  }
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/ads', adRoutes);
app.use('/api/podcast', podcastRoutes);
app.use('/api/membership', membershipRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/ad-requests', adRequestRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ad-pricing', adPricingRoutes);
app.use('/api/revenue', revenueRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/platform-settings', platformSettingsRoutes);
app.use('/api/ad-area-pricing', adAreaPricingRoutes);
app.use('/api/users', userManagementRoutes);
app.use('/api/webinars', webinarRoutes);
app.use('/api/promo-codes', promoCodeRoutes);

// Ensure models are registered (crucial for Sequelize)
require('./models/AdRequest');
require('./models/EmailSettings');
require('./models/EmailLog');
require('./models/PodcastFormField');
require('./models/PodcastGuest');
require('./models/PodcastEpisode');
require('./models/SeoSettings');
require('./models/SiteAnalytics');
require('./models/BreakingNews');
require('./models/Follower');
require('./models/Rating');
require('./models/AdAreaPricing');
require('./models/AdPricing');
require('./models/AdRevenue');
require('./models/PlatformSettings');
require('./models/Withdrawal');
require('./models/Article');
require('./models/Ad');
require('./models/User');
require('./models/Plan');
require('./models/Comment');
require('./models/ManagerActivity');
require('./models/Webinar');
require('./models/WebinarRegistration');
require('./models/PromoCode');

const fs = require('fs');
const distPath = process.env.FRONTEND_DIST_PATH || path.join(__dirname, '..', 'frontend', 'dist');

const unicodeSlugify = (text) => {
  if (!text) return 'article';
  const slug = text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')                // Replace spaces/whitespace with hyphens
    .replace(/[^\p{L}\p{N}-]+/gu, '')    // Keep Unicode letters, numbers, and hyphens
    .replace(/-+/g, '-')                 // Collapse multiple hyphens
    .replace(/(^-|-$)/g, '');            // Strip leading/trailing hyphens
  return slug || 'article';
};

// ─── Dynamic sitemap.xml with all articles, webinars, and authors from DB ───
app.get('/sitemap.xml', async (req, res) => {
  try {
    const Article = require('./models/Article');
    const Webinar = require('./models/Webinar');
    const User = require('./models/User');

    const articles = await Article.findAll({
      attributes: ['id', 'title', 'category', 'updatedAt'],
      order: [['updatedAt', 'DESC']],
      limit: 5000
    });

    const webinars = await Webinar.findAll({
      attributes: ['id', 'title', 'updatedAt'],
      order: [['dateTime', 'DESC']],
      limit: 1000
    });

    const authors = await User.findAll({
      where: {
        role: ['reporter', 'superadmin', 'author', 'corporate']
      },
      attributes: ['id', 'name', 'updatedAt']
    });

    // Static pages
    const staticPages = [
      { loc: '/', priority: '1.0', changefreq: 'daily' },
      { loc: '/news', priority: '0.9', changefreq: 'daily' },
      { loc: '/trending', priority: '0.9', changefreq: 'daily' },
      { loc: '/business', priority: '0.8', changefreq: 'daily' },
      { loc: '/startup', priority: '0.8', changefreq: 'weekly' },
      { loc: '/oem', priority: '0.8', changefreq: 'weekly' },
      { loc: '/automation', priority: '0.8', changefreq: 'weekly' },
      { loc: '/interview', priority: '0.7', changefreq: 'weekly' },
      { loc: '/manufacturing', priority: '0.8', changefreq: 'weekly' },
      { loc: '/event', priority: '0.7', changefreq: 'weekly' },
      { loc: '/tender', priority: '0.7', changefreq: 'daily' },
      { loc: '/education', priority: '0.7', changefreq: 'weekly' },
      { loc: '/entertainment', priority: '0.6', changefreq: 'weekly' },
      { loc: '/sports', priority: '0.6', changefreq: 'weekly' },
      { loc: '/acquisitions', priority: '0.7', changefreq: 'weekly' },
      { loc: '/regional', priority: '0.8', changefreq: 'daily' },
      { loc: '/magazine', priority: '0.6', changefreq: 'monthly' },
      { loc: '/about', priority: '0.5', changefreq: 'monthly' },
      { loc: '/contact', priority: '0.5', changefreq: 'monthly' },
      { loc: '/privacy', priority: '0.3', changefreq: 'yearly' },
      { loc: '/terms', priority: '0.3', changefreq: 'yearly' },
      { loc: '/disclaimer', priority: '0.3', changefreq: 'yearly' },
      { loc: '/webinars', priority: '0.8', changefreq: 'weekly' },
    ];

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Add static pages
    for (const page of staticPages) {
      xml += `  <url>\n`;
      xml += `    <loc>https://industrialtimes.in${page.loc}</loc>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += `  </url>\n`;
    }

    // Add all published articles dynamically
    for (const article of articles) {
      const slug = unicodeSlugify(article.title);
      const category = unicodeSlugify(article.category || 'news');
      const lastmod = article.updatedAt ? new Date(article.updatedAt).toISOString().split('T')[0] : '';
      xml += `  <url>\n`;
      xml += `    <loc>https://industrialtimes.in/article/${category}/${slug}/${article.id}</loc>\n`;
      if (lastmod) xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.7</priority>\n`;
      xml += `  </url>\n`;
    }

    const standardSlugify = (text) => {
      if (!text) return '';
      return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
    };

    // Add all webinars dynamically
    for (const webinar of webinars) {
      const slug = standardSlugify(webinar.title);
      const lastmod = webinar.updatedAt ? new Date(webinar.updatedAt).toISOString().split('T')[0] : '';
      xml += `  <url>\n`;
      xml += `    <loc>https://industrialtimes.in/webinar/${slug}</loc>\n`;
      if (lastmod) xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.7</priority>\n`;
      xml += `  </url>\n`;
    }

    // Add system admin author profile
    xml += `  <url>\n`;
    xml += `    <loc>https://industrialtimes.in/author/Industrial-Times</loc>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.5</priority>\n`;
    xml += `  </url>\n`;

    // Add all authors dynamically
    for (const author of authors) {
      const lastmod = author.updatedAt ? new Date(author.updatedAt).toISOString().split('T')[0] : '';
      xml += `  <url>\n`;
      xml += `    <loc>https://industrialtimes.in/author/${author.id}</loc>\n`;
      if (lastmod) xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.5</priority>\n`;
      xml += `  </url>\n`;
    }

    xml += '</urlset>';
    res.set('Content-Type', 'application/xml');
    return res.send(xml);
  } catch (err) {
    console.error('Error generating dynamic sitemap:', err.message);
    // Fallback to static sitemap file
    return res.sendFile(path.join(distPath, 'sitemap.xml'));
  }
});

// ─── Serve robots.txt with correct Content-Type ───
app.get('/robots.txt', (req, res) => {
  const robotsPath = path.join(distPath, 'robots.txt');
  if (fs.existsSync(robotsPath)) {
    res.set('Content-Type', 'text/plain');
    return res.sendFile(robotsPath);
  }
  // Fallback: send inline robots.txt
  res.set('Content-Type', 'text/plain');
  res.send(
    'User-agent: *\nAllow: /\n\nUser-agent: Mediapartners-Google\nAllow: /\n\nUser-agent: Googlebot\nAllow: /\n\nUser-agent: AdsBot-Google\nAllow: /\n\nUser-agent: AdsBot-Google-Mobile\nAllow: /\n\nSitemap: https://industrialtimes.in/sitemap.xml\n'
  );
});

// ─── Serve ads.txt with correct Content-Type ───
app.get('/ads.txt', (req, res) => {
  const adsPath = path.join(distPath, 'ads.txt');
  if (fs.existsSync(adsPath)) {
    res.set('Content-Type', 'text/plain');
    return res.sendFile(adsPath);
  }
  // Fallback: send inline ads.txt
  res.set('Content-Type', 'text/plain');
  res.send('google.com, pub-3984464028103389, DIRECT, f08c47fec0942fa0\n');
});

// ─── Serve Google Verification File ───
app.get('/google5ed77c959345bc8a.html', (req, res) => {
  res.send('google-site-verification: google5ed77c959345bc8a.html');
});

// ─── Serve favicon.ico from distPath or fallback to icon.png ───
app.get('/favicon.ico', (req, res) => {
  const icoPath = path.join(distPath, 'favicon.ico');
  if (fs.existsSync(icoPath)) {
    return res.sendFile(icoPath);
  }
  const pngPath = path.join(distPath, 'icon.png');
  if (fs.existsSync(pngPath)) {
    return res.sendFile(pngPath);
  }
  // Try public folder in dev/fallback
  const devPngPath = path.join(__dirname, '..', 'frontend', 'public', 'icon.png');
  if (fs.existsSync(devPngPath)) {
    return res.sendFile(devPngPath);
  }
  res.status(404).end();
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  // Cache index.html in memory to avoid reading from disk on every request
  let cachedIndexHtml = null;
  const getIndexHtml = () => {
    try {
      if (!cachedIndexHtml) {
        const indexHtmlPath = path.join(distPath, 'index.html');
        if (fs.existsSync(indexHtmlPath)) {
          cachedIndexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
        }
      }
      return cachedIndexHtml;
    } catch (err) {
      console.error('Error reading index.html from distPath:', err.message);
      return null;
    }
  };
  // Refresh cache every 5 minutes
  setInterval(() => { cachedIndexHtml = null; }, 5 * 60 * 1000);

  // Render function that injects dynamic page content. Falls back to minimal valid HTML if index.html is missing.
  const renderPage = (title, bodyContent, ogTags = '', reqPath = '/') => {
    let html = getIndexHtml();
    const canonicalUrl = `https://industrialtimes.in${reqPath}`;
    if (html) {
      if (ogTags) {
        html = html.replace(
          /<!-- Default OG Tags.*?<meta name="twitter:description"[^>]*>/s,
          ogTags
        );
      }
      html = html.replace(
        /<title>.*?<\/title>/,
        `<title>${title}</title>`
      );
      // Dynamically replace static canonical URL with the current request path canonical
      html = html.replace(
        /<link rel="canonical" href="[^"]*"\s*\/?>/,
        `<link rel="canonical" href="${canonicalUrl}" />`
      );
      html = html.replace(
        '<div id="root"></div>',
        `<div id="root">${bodyContent}</div>`
      );
      return html;
    } else {
      // Inlined fallback structure with AdSense tags so verification succeeds even if index.html is missing
      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="google-adsense-account" content="ca-pub-3984464028103389">
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3984464028103389" crossorigin="anonymous"></script>
  <link rel="canonical" href="${canonicalUrl}" />
  <title>${title}</title>
  ${ogTags}
</head>
<body>
  <div id="root">
    ${bodyContent}
  </div>
</body>
</html>`;
    }
  };

  // Redirect legacy /gallery route to homepage
  app.get(['/gallery', '/gallery/'], (req, res) => {
    res.redirect(301, '/');
  });

  app.use(express.static(distPath, { index: false }));

  // ─── Crawler detection + pre-rendered HTML for ALL Google bots ───
  app.get(/.*/, async (req, res) => {
    const userAgent = req.headers['user-agent'] || '';
    const isCrawler = /Googlebot|Mediapartners-Google|AdsBot-Google|AdsBot-Google-Mobile|Google-InspectionTool|Google-AdWords|facebookexternalhit|Facebot|Twitterbot|LinkedInBot|WhatsApp|Slackbot|TelegramBot|Pinterest|vkShare|Discordbot|bingbot|YandexBot/i.test(userAgent);

    let cleanPath = req.path;
    if (cleanPath.length > 1 && cleanPath.endsWith('/')) {
      cleanPath = cleanPath.slice(0, -1);
    }

    // Set of all valid static pathnames mapped by react-router
    const validStaticPaths = new Set([
      '/', '', '/index.html', '/regional', '/area-news', '/news', '/articles', '/trending',
      '/oem', '/automation', '/interview', '/interviews', '/startup', '/startups',
      '/business', '/event', '/events', '/tender', '/tenders', '/astrology',
      '/entertainment', '/sports', '/education', '/manufacturing', '/acquisitions',
      '/mediakit', '/magazine', '/about', '/careers', '/press', '/contact',
      '/advertisement', '/media-partnership', '/rss', '/privacy', '/terms',
      '/disclaimer', '/grievance', '/sitemap', '/external', '/trending-article',
      '/search', '/favorites', '/upgrade', '/profile', '/webinars', '/podcast',
      '/podcast-apply', '/podcast_apply', '/login', '/signup', '/corporate/choose-plan',
      '/corporate/login', '/corporate/payment', '/reporter-dashboard', '/user-dashboard'
    ]);

    const articleMatch = cleanPath.match(/^\/article\/([^/]+)\/([^/]+)(?:\/(.+))?$/);
    const webinarMatch = cleanPath.match(/^\/webinar\/([^/]+)$/);
    const webinarRegisterMatch = cleanPath.match(/^\/webinar\/([^/]+)\/register$/);
    const authorMatch = cleanPath.match(/^\/author\/([^/]+)$/);

    const isValidPath =
      validStaticPaths.has(cleanPath) ||
      articleMatch ||
      webinarMatch ||
      webinarRegisterMatch ||
      authorMatch;

    if (isCrawler) {
      if (!isValidPath) {
        return res.status(404).send(renderPage("Page Not Found | Industrial Times", "<h1>404 - Page Not Found</h1><p>The requested page could not be found on Industrial Times.</p>", '', cleanPath));
      }

      try {
        const pageUrl = `${req.protocol}://${req.get('host')}${cleanPath}`;

        // ── WEBINAR DETAIL PAGE ──
        if (webinarMatch) {
          const Webinar = require('./models/Webinar');
          const identifier = decodeURIComponent(webinarMatch[1]);
          let webinar = null;

          if (!isNaN(identifier)) {
            webinar = await Webinar.findByPk(identifier);
          } else {
            const webinars = await Webinar.findAll({ attributes: ['id', 'title', 'description', 'speaker', 'dateTime'] });
            const slugifyLocal = (text) => {
              if (!text) return '';
              return text
                .toString()
                .toLowerCase()
                .trim()
                .replace(/\s+/g, '-')
                .replace(/[^\w-]+/g, '')
                .replace(/--+/g, '-')
                .replace(/^-+/, '')
                .replace(/-+$/, '');
            };
            const found = webinars.find(w => slugifyLocal(w.title) === identifier.toLowerCase());
            if (found) {
              webinar = await Webinar.findByPk(found.id);
            }
          }

          if (webinar) {
            const title = webinar.title || 'Industrial Times Webinar';
            const description = webinar.description ? webinar.description.substring(0, 200).replace(/[<>"'&]/g, '') : 'Join this interactive webinar on Industrial Times';

            const ogTags = `
            <meta property="og:type" content="video.other" />
            <meta property="og:site_name" content="Industrial Times" />
            <meta property="og:title" content="${title}" />
            <meta property="og:description" content="${description}" />
            <meta property="og:url" content="${pageUrl}" />
            <meta name="twitter:card" content="summary" />
            <meta name="twitter:title" content="${title}" />
            <meta name="twitter:description" content="${description}" />
            `;

            const webinarHtml = `
              <h1>${title}</h1>
              ${webinar.speaker ? `<p>Speaker: ${webinar.speaker}</p>` : ''}
              <p>Date: ${new Date(webinar.dateTime).toLocaleString()}</p>
              <article>${webinar.description || ''}</article>
            `;

            return res.send(renderPage(`${title} | Industrial Times Webinars`, webinarHtml, ogTags, cleanPath));
          } else {
            return res.status(404).send(renderPage("Webinar Not Found | Industrial Times", "<h1>404 - Webinar Not Found</h1><p>The requested webinar could not be found.</p>", '', cleanPath));
          }
        }

        // ── WEBINAR REGISTER PAGE ──
        if (webinarRegisterMatch) {
          const Webinar = require('./models/Webinar');
          const identifier = decodeURIComponent(webinarRegisterMatch[1]);
          let webinar = null;

          if (!isNaN(identifier)) {
            webinar = await Webinar.findByPk(identifier);
          } else {
            const webinars = await Webinar.findAll({ attributes: ['id', 'title'] });
            const slugifyLocal = (text) => {
              if (!text) return '';
              return text
                .toString()
                .toLowerCase()
                .trim()
                .replace(/\s+/g, '-')
                .replace(/[^\w-]+/g, '')
                .replace(/--+/g, '-')
                .replace(/^-+/, '')
                .replace(/-+$/, '');
            };
            const found = webinars.find(w => slugifyLocal(w.title) === identifier.toLowerCase());
            if (found) {
              webinar = await Webinar.findByPk(found.id);
            }
          }

          if (webinar) {
            const title = `Register for ${webinar.title}`;
            const registerHtml = `
              <h1>Register for: ${webinar.title}</h1>
              <p>Sign up now to secure your spot for the Industrial Times Webinar.</p>
            `;
            return res.send(renderPage(`${title} | Industrial Times`, registerHtml, '', cleanPath));
          } else {
            return res.status(404).send(renderPage("Webinar Not Found | Industrial Times", "<h1>404 - Webinar Not Found</h1><p>The requested webinar could not be found.</p>", '', cleanPath));
          }
        }

        // ── WEBINARS LIST PAGE ──
        if (cleanPath === '/webinars') {
          const Webinar = require('./models/Webinar');
          const webinarsList = await Webinar.findAll({
            order: [['dateTime', 'DESC']],
            limit: 30
          });

          let webinarsHtml = `
            <h1>Industrial Times Webinars — Live & Archived Sessions</h1>
            <p>Join our premium industrial webinars, startups sessions, and live interactive conferences with industrial leaders.</p>
            <h2>Upcoming & Past Webinars</h2>
            <ul>
          `;

          const slugifyLocal = (text) => {
            if (!text) return '';
            return text
              .toString()
              .toLowerCase()
              .trim()
              .replace(/\s+/g, '-')
              .replace(/[^\w-]+/g, '')
              .replace(/--+/g, '-')
              .replace(/^-+/, '')
              .replace(/-+$/, '');
          };

          for (const web of webinarsList) {
            const slug = slugifyLocal(web.title);
            const desc = web.description ? web.description.substring(0, 150).replace(/[<>"'&]/g, '') : '';
            webinarsHtml += `<li><a href="/webinar/${slug}">${web.title}</a><p>${desc}</p></li>\n`;
          }
          webinarsHtml += `</ul>`;

          return res.send(renderPage("Webinars | Industrial Times", webinarsHtml, '', cleanPath));
        }

        // ── AUTHOR PROFILE PAGE ──
        if (authorMatch) {
          const User = require('./models/User');
          const Article = require('./models/Article');
          const authorIdOrName = decodeURIComponent(authorMatch[1]);
          let author = null;

          if (authorIdOrName === 'Industrial-Times') {
            author = await User.findOne({ where: { name: 'Industrial Times' } });
          } else if (!isNaN(authorIdOrName)) {
            author = await User.findByPk(authorIdOrName);
          } else {
            author = await User.findOne({ where: { name: authorIdOrName } });
          }

          if (author) {
            // Fetch author's articles
            const authorArticles = await Article.findAll({
              where: {
                [Op.or]: [
                  { authorId: author.id },
                  { author: author.name }
                ]
              },
              order: [['createdAt', 'DESC']],
              limit: 20,
              attributes: ['id', 'title', 'category', 'content']
            });

            const title = `${author.name} | Reporter Profile`;
            const description = author.bio || `${author.name} is a contributing reporter at Industrial Times.`;
            const imageUrl = author.profilePic ? (author.profilePic.startsWith('http') ? author.profilePic : `${req.protocol}://${req.get('host')}${author.profilePic}`) : '';

            const ogTags = `
            <meta property="og:type" content="profile" />
            <meta property="og:site_name" content="Industrial Times" />
            <meta property="og:title" content="${title}" />
            <meta property="og:description" content="${description}" />
            ${imageUrl ? `<meta property="og:image" content="${imageUrl}" />` : ''}
            <meta property="og:url" content="${pageUrl}" />
            <meta name="twitter:card" content="summary" />
            <meta name="twitter:title" content="${title}" />
            <meta name="twitter:description" content="${description}" />
            ${imageUrl ? `<meta name="twitter:image" content="${imageUrl}" />` : ''}
            `;

            let authorHtml = `
              <h1>${author.name}</h1>
              <p>${description}</p>
              <h2>Articles Published by ${author.name}</h2>
              <ul>
            `;

            for (const art of authorArticles) {
              const slug = unicodeSlugify(art.title);
              const cat = unicodeSlugify(art.category || 'news');
              authorHtml += `<li><a href="/article/${cat}/${slug}/${art.id}">${art.title}</a></li>\n`;
            }
            authorHtml += `</ul>`;

            return res.send(renderPage(`${author.name} - Author Profile | Industrial Times`, authorHtml, ogTags, cleanPath));
          } else {
            return res.status(404).send(renderPage("Author Not Found | Industrial Times", "<h1>404 - Author Not Found</h1><p>The requested author profile could not be found.</p>", '', cleanPath));
          }
        }

        // ── ARTICLE PAGE ──
        if (articleMatch) {
          const Article = require('./models/Article');
          let article = null;
          const titleParam = articleMatch[2];
          const idParam = articleMatch[3];

          if (idParam && !isNaN(idParam)) {
            article = await Article.findByPk(idParam);
          } else {
            // Slug-based lookup for pre-rendering (handles routes without an ID)
            const decodedTitle = decodeURIComponent(titleParam).toLowerCase().trim();
            const normalize = (str) => {
              if (!str) return '';
              return str
                .toString()
                .toLowerCase()
                .trim()
                .replace(/\s+/g, '-')
                .replace(/[^\p{L}\p{N}-]+/gu, '')
                .replace(/-+/g, '-')
                .replace(/(^-|-$)/g, '');
            };
            const cleanSlug = normalize(decodedTitle);
            const searchWords = cleanSlug.split('-').filter(w => w.length > 2);
            const { Op } = require('sequelize');
            const likeOp = sequelize.getDialect() === 'postgres' ? Op.iLike : Op.like;

            let match = null;
            if (searchWords.length > 0) {
              const candidateClause = searchWords.slice(0, 3).map(word => ({
                title: { [likeOp]: `%${word}%` }
              }));
              const candidateArticles = await Article.findAll({
                where: { [Op.and]: candidateClause },
                attributes: ['id', 'title'],
                limit: 10
              });
              match = candidateArticles.find(a => normalize(a.title) === cleanSlug);
            }

            if (!match) {
              const recentArticles = await Article.findAll({
                attributes: ['id', 'title'],
                order: [['createdAt', 'DESC']],
                limit: 200
              });
              match = recentArticles.find(a => normalize(a.title) === cleanSlug);

              if (!match && searchWords.length > 0) {
                let bestMatch = null;
                let highestScore = 0;

                for (const a of recentArticles) {
                  if (!a.title) continue;
                  const titleWords = normalize(a.title).split('-');
                  const score = searchWords.filter(w => titleWords.includes(w)).length;
                  if (score > highestScore) {
                    highestScore = score;
                    bestMatch = a;
                  }
                }

                if (bestMatch && (highestScore / searchWords.length) >= 0.6) {
                  match = bestMatch;
                }
              }
            }

            if (match) {
              article = await Article.findByPk(match.id);
            }
          }

          if (article) {
            const title = article.title || 'Industrial Times';
            const description = article.content ? article.content.substring(0, 200).replace(/[<>"'&]/g, '') : 'Read on Industrial Times';
            const imageUrl = article.image ? (article.image.startsWith('http') ? article.image : `${req.protocol}://${req.get('host')}${article.image}`) : '';

            const ogTags = `
            <meta property="og:type" content="article" />
            <meta property="og:site_name" content="Industrial Times" />
            <meta property="og:title" content="${title}" />
            <meta property="og:description" content="${description}" />
            <meta property="og:image" content="${imageUrl}" />
            <meta property="og:url" content="${pageUrl}" />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content="${title}" />
            <meta name="twitter:description" content="${description}" />
            <meta name="twitter:image" content="${imageUrl}" />
            `;

            const articleHtml = `
              <h1>${title}</h1>
              ${article.category ? `<p>Category: ${article.category}</p>` : ''}
              ${imageUrl ? `<img src="${imageUrl}" alt="${title}" />` : ''}
              <article>${(article.content || '').substring(0, 1500)}</article>
            `;

            return res.send(renderPage(`${title} | Industrial Times`, articleHtml, ogTags, cleanPath));
          } else {
            return res.status(404).send(renderPage("Article Not Found | Industrial Times", "<h1>404 - Article Not Found</h1><p>The requested article could not be found.</p>", '', cleanPath));
          }
        }

        // ── HOMEPAGE ──
        if (cleanPath === '/' || cleanPath === '' || cleanPath === '/index.html') {
          const Article = require('./models/Article');
          const latestArticles = await Article.findAll({
            order: [['createdAt', 'DESC']],
            limit: 20,
            attributes: ['id', 'title', 'category', 'content', 'image', 'createdAt']
          });

          let homepageHtml = `
            <h1>Industrial Times — India's Digital Industrial Media Platform</h1>
            <p>India's growing digital industrial media platform delivering industrial news, business promotions, startup stories, podcast interviews, and event coverage.</p>
            <h2>Latest News</h2>
            <ul>
          `;
          for (const art of latestArticles) {
            const slug = unicodeSlugify(art.title);
            const cat = unicodeSlugify(art.category || 'news');
            const desc = art.content ? art.content.substring(0, 150).replace(/[<>"'&]/g, '') : '';
            homepageHtml += `<li><a href="/article/${cat}/${slug}/${art.id}">${art.title}</a><p>${desc}</p></li>\n`;
          }
          homepageHtml += `</ul>
            <nav>
              <a href="/news">News</a> | <a href="/trending">Trending</a> | <a href="/business">Business</a> |
              <a href="/startup">Startups</a> | <a href="/oem">OEM</a> | <a href="/automation">Automation</a> |
              <a href="/manufacturing">Manufacturing</a> | <a href="/interview">Interviews</a> |
              <a href="/event">Events</a> | <a href="/tender">Tenders</a> | <a href="/regional">Regional</a> |
              <a href="/about">About</a> | <a href="/contact">Contact</a> | <a href="/privacy">Privacy</a>
            </nav>
          `;

          return res.send(renderPage("Industrial Times — India's Digital Industrial Media Platform", homepageHtml, '', cleanPath));
        }

        // ── CATEGORY PAGES ──
        const categoryRoutes = ['news', 'trending', 'business', 'startup', 'startups', 'oem', 'automation',
          'interview', 'interviews', 'manufacturing', 'event', 'events', 'tender', 'tenders',
          'education', 'entertainment', 'sports', 'astrology', 'acquisitions', 'mediakit', 'magazine',
          'articles'];
        const pathClean = cleanPath.replace(/^\//, '').toLowerCase();
        if (categoryRoutes.includes(pathClean)) {
          const Article = require('./models/Article');
          const categoryName = pathClean.charAt(0).toUpperCase() + pathClean.slice(1);
          const categoryArticles = await Article.findAll({
            where: { category: categoryName },
            order: [['createdAt', 'DESC']],
            limit: 20,
            attributes: ['id', 'title', 'category', 'content']
          });

          let catHtml = `<h1>${categoryName} — Industrial Times</h1><ul>`;
          for (const art of categoryArticles) {
            const slug = unicodeSlugify(art.title);
            const cat = unicodeSlugify(art.category || 'news');
            const desc = art.content ? art.content.substring(0, 150).replace(/[<>"'&]/g, '') : '';
            catHtml += `<li><a href="/article/${cat}/${slug}/${art.id}">${art.title}</a><p>${desc}</p></li>\n`;
          }
          catHtml += '</ul>';

          return res.send(renderPage(`${categoryName} News | Industrial Times`, catHtml, '', cleanPath));
        }

        // ── REGIONAL PAGES ──
        if (cleanPath === '/regional' || cleanPath === '/area-news') {
          const Article = require('./models/Article');
          const regionalArticles = await Article.findAll({
            order: [['createdAt', 'DESC']],
            limit: 20,
            attributes: ['id', 'title', 'category', 'content', 'image', 'createdAt']
          });

          let regionalHtml = `
            <h1>Regional News — Industrial Times</h1>
            <p>Latest news, developments, and updates from Jamshedpur, Jharkhand, and other regions.</p>
            <ul>
          `;
          for (const art of regionalArticles) {
            const slug = unicodeSlugify(art.title);
            const cat = unicodeSlugify(art.category || 'news');
            const desc = art.content ? art.content.substring(0, 150).replace(/[<>"'&]/g, '') : '';
            regionalHtml += `<li><a href="/article/${cat}/${slug}/${art.id}">${art.title}</a><p>${desc}</p></li>\n`;
          }
          regionalHtml += `</ul>`;

          return res.send(renderPage("Regional News | Industrial Times", regionalHtml, '', cleanPath));
        }

        // ── STATIC/GENERIC PAGES ──
        const staticPages = {
          'about': {
            title: 'About Us',
            content: `
              <h2>About Industrial Times</h2>
              <p>Industrial Times is a digital news and media platform dedicated to delivering accurate, timely, and insightful coverage of industry, business, manufacturing, automation, technology, startups, infrastructure, energy, and economic developments from India and around the world.</p>
              <h2>Our Vision</h2>
              <p>To become India's most trusted industrial news platform by promoting knowledge sharing, innovation, industrial growth, and informed decisionmaking across sectors.</p>
              <h2>Ownership & Operations</h2>
              <p>Industrial Times is operated and managed by a professional team committed to delivering high-quality digital journalism and industry-focused content. The platform is supported by experienced professionals with expertise in industrial technologies, business communications, and digital media. Industrial Times is a digital media initiative supported by Radiogeet Digital Pvt. Ltd.</p>
            `
          },
          'careers': {
            title: 'Careers',
            content: `
              <p>Join our dynamic team at Industrial Times. We are always looking for passionate individuals who are eager to make an impact in the world of industrial media and journalism.</p>
              <p>We offer opportunities across editorial, digital marketing, content creation, video production, and business development. If you are passionate about industry, technology, and media — we would love to hear from you.</p>
            `
          },
          'press': {
            title: 'Press Releases',
            content: `
              <p>Industrial Times is India's growing digital industrial media platform delivering industrial news, business promotions, startup stories, podcast interviews, recruitment updates, and industrial event coverage. We support industries, MSMEs, startups, manufacturers, and technology companies through digital marketing, advertisement publishing, corporate branding, and multimedia content solutions.</p>
              <p>Our platform connects businesses with industrial audiences across sectors including steel, mining, power, manufacturing, automation, infrastructure, and Industry 4.0. Industrial Times is committed to promoting industrial innovation, business growth, and digital transformation through modern media communication and industry-focused content services. (Arian Industrial Times)</p>
            `
          },
          'contact': {
            title: 'Contact Us',
            content: `
              <p>Get in touch with Industrial Times for any inquiries, support, feedback, or business collaboration. We value your input and are here to help.</p>
              <p>Whether you want to advertise, partner for media coverage, submit press releases, or simply reach out for information — our team is ready to assist you.</p>
              <p><strong>WhatsApp Only:</strong> +91 7903451885</p>
              <p><strong>Email:</strong> info@industrialtimes.in</p>
            `
          },
          'advertisement': {
            title: 'Advertise With Us',
            content: `
              <p>Industrial Times offers powerful advertising and digital promotion opportunities for industries, startups, manufacturers, engineering companies, automation brands, and MSMEs. Promote your products, services, events, job openings, and business campaigns through our industrial news portal, social media platforms, podcasts, and multimedia marketing solutions.</p>
              <p>We help businesses increase brand visibility, generate leads, and connect with industrial audiences across sectors including steel, mining, power, cement, manufacturing, infrastructure, and Industry 4.0. Partner with Industrial Times to showcase your business to a growing industrial community through targeted and effective digital media promotion.</p>
            `
          },
          'media-partnership': {
            title: 'Media Partnership',
            content: `
              <p>Industrial Times offers strategic media partnership opportunities for industrial expos, corporate events, trade fairs, startup summits, technology conferences, and business exhibitions. As a digital industrial media platform, we provide event promotion, press coverage, social media marketing, podcast interviews, brand visibility, and multimedia content support to help partners reach a wider industrial audience.</p>
              <p>Our platform connects industries, manufacturers, startups, and business leaders across sectors including steel, mining, power, cement, manufacturing, automation, infrastructure, and Industry 4.0. Partner with Industrial Times to enhance your event visibility, audience engagement, and industrial media presence through professional digital media solutions.</p>
            `
          },
          'rss': {
            title: 'RSS Feeds',
            content: `
              <p>Subscribe to Industrial Times RSS feeds to get the latest industrial news, business updates, and event coverage delivered directly to your reader.</p>
              <p>Stay updated with real-time content from across sectors including steel, mining, power, manufacturing, automation, infrastructure, and Industry 4.0.</p>
            `
          },
          'privacy': {
            title: 'Privacy Policy',
            content: `
              <p>Industrial Times respects your privacy and is committed to protecting your personal information. Any details collected through our website, contact forms, advertisements, subscriptions, or business inquiries are used only for communication, service improvement, marketing support, and customer assistance.</p>
              <p>We do not sell or share personal information with unauthorized third parties. By using our website, you agree to our data collection and usage practices. Users are responsible for the accuracy of the information submitted on the platform. Industrial Times reserves the right to update this privacy policy at any time without prior notice.</p>
            `
          },
          'terms': {
            title: 'Terms & Conditions',
            content: `
              <p>By accessing and using Industrial Times, users agree to comply with all applicable terms, policies, and regulations of the platform. All content, news, advertisements, logos, videos, and media published on the website are the property of Industrial Times or respective owners and may not be copied or reused without permission.</p>
              <p>Users must not upload misleading, illegal, harmful, or unauthorized content on the platform. Industrial Times reserves the right to modify, remove, or update website content and services at any time without prior notice. Continued use of the website indicates acceptance of these terms and conditions.</p>
            `
          },
          'disclaimer': {
            title: 'Disclaimer',
            content: `
              <p>The information published on Industrial Times is provided for general informational, industrial, and promotional purposes only. While we strive to ensure accuracy and reliability, Industrial Times does not guarantee the completeness, correctness, or timeliness of any content, advertisements, job postings, business promotions, or external links available on the platform.</p>
              <p>Opinions expressed in articles, podcasts, interviews, or promotional content belong to their respective authors or organizations. Industrial Times shall not be held responsible for any loss, damage, or business decisions made based on the information provided on this website or associated digital media platforms.</p>
            `
          },
          'grievance': {
            title: 'Grievance Redressal',
            content: `
              <p>Industrial Times is committed to maintaining transparency, professionalism, and responsible digital media practices. If any user, company, or organization has concerns regarding published content, advertisements, copyright issues, business promotions, or any information available on the platform, they may contact our support team for resolution.</p>
              <p>We aim to review and address all genuine grievances promptly and fairly in accordance with applicable laws and platform policies. Users are requested to provide complete details and supporting information while submitting complaints or concerns.</p>
            `
          },
          'sitemap': {
            title: 'Sitemap',
            content: `
              <p>Navigate through the Industrial Times website easily using this comprehensive sitemap. Find all our sections, categories, and pages in one place.</p>
            `
          }
        };

        const staticPageKey = cleanPath.replace(/^\//, '').toLowerCase();
        if (staticPages[staticPageKey]) {
          const page = staticPages[staticPageKey];
          let pageHtml = `<h1>${page.title}</h1>\n<div>${page.content}</div>`;
          return res.send(renderPage(`${page.title} | Industrial Times`, pageHtml, '', cleanPath));
        }

        // ── GENERIC FALLBACK for any unmatched BUT VALID crawler route ──
        const fallbackHtml = `
          <h1>Industrial Times — India's Digital Industrial Media Platform</h1>
          <p>India's growing digital industrial media platform delivering industrial news, business promotions, startup stories, podcast interviews, and event coverage.</p>
          <p>Industrial Times covers manufacturing, automation, OEM, infrastructure, energy, startups, business, acquisitions, education, entertainment, sports, regional developments, tenders, interviews, events, and more.</p>
          <nav>
            <a href="/news">News</a> | <a href="/trending">Trending</a> | <a href="/business">Business</a> |
            <a href="/startup">Startups</a> | <a href="/manufacturing">Manufacturing</a> | <a href="/automation">Automation</a> |
            <a href="/oem">OEM</a> | <a href="/interview">Interviews</a> | <a href="/event">Events</a> |
            <a href="/tender">Tenders</a> | <a href="/regional">Regional</a> |
            <a href="/about">About</a> | <a href="/contact">Contact</a> |
            <a href="/privacy">Privacy Policy</a> | <a href="/terms">Terms & Conditions</a> | <a href="/disclaimer">Disclaimer</a>
          </nav>
          <p>Contact: info@industrialtimes.in | Industrial Times is a digital media initiative by Radiogeet Digital Pvt. Ltd.</p>
        `;
        return res.send(renderPage("Industrial Times — India's Digital Industrial Media Platform", fallbackHtml, '', cleanPath));

      } catch (err) {
        console.error('Error serving pre-rendered HTML for crawler:', err.message);
        const fallbackHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="google-adsense-account" content="ca-pub-3984464028103389">
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3984464028103389" crossorigin="anonymous"></script>
  <title>Industrial Times</title>
</head>
<body>
  <h1>Industrial Times — India's Digital Industrial Media Platform</h1>
  <p>India's growing digital industrial media platform delivering industrial news, business promotions, startup stories, podcast interviews, and event coverage.</p>
</body>
</html>`;
        return res.send(fallbackHtml);
      }
    }

    // Serve standard client-side routing for browsers
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('Web application files not found. If this is a new deployment, please ensure the frontend is built and FRONTEND_DIST_PATH is configured in the environment.');
    }
  });
}

// Helper to convert absolute localhost URLs in database to relative paths
const fixExistingImageUrls = async () => {
  try {
    const Article = require('./models/Article');
    const Ad = require('./models/Ad');
    const User = require('./models/User');
    const { Op } = require('sequelize');
    const likeOp = sequelize.getDialect() === 'postgres' ? Op.iLike : Op.like;

    // Fix Articles
    const articles = await Article.findAll({
      where: {
        [Op.or]: [
          { image: { [likeOp]: 'http://localhost:%' } },
          { video: { [likeOp]: 'http://localhost:%' } }
        ]
      }
    });
    for (const art of articles) {
      let updated = false;
      if (art.image && (art.image.startsWith('http://localhost:5000') || art.image.startsWith('http://localhost:3000'))) {
        art.image = art.image.replace(/http:\/\/localhost:(5000|3000)/g, '');
        updated = true;
      }
      if (art.video && (art.video.startsWith('http://localhost:5000') || art.video.startsWith('http://localhost:3000'))) {
        art.video = art.video.replace(/http:\/\/localhost:(5000|3000)/g, '');
        updated = true;
      }
      if (updated) await art.save();
    }

    // Fix Ads
    const ads = await Ad.findAll({
      where: {
        imageUrl: { [likeOp]: 'http://localhost:%' }
      }
    });
    for (const ad of ads) {
      if (ad.imageUrl) {
        ad.imageUrl = ad.imageUrl.replace(/http:\/\/localhost:(5000|3000)/g, '');
        await ad.save();
      }
    }

    // Fix Users
    const users = await User.findAll({
      where: {
        profilePic: { [likeOp]: 'http://localhost:%' }
      }
    });
    for (const user of users) {
      if (user.profilePic) {
        user.profilePic = user.profilePic.replace(/http:\/\/localhost:(5000|3000)/g, '');
        await user.save();
      }
    }

    // Fix default brand user email from .com to .in
    const itUser = await User.findOne({ where: { name: 'Industrial Times' } });
    if (itUser) {
      let emailUpdated = false;
      if (itUser.email === 'info@industrialtimes.com') {
        itUser.email = 'info@industrialtimes.in';
        emailUpdated = true;
      }
      if (emailUpdated) {
        await itUser.save();
        console.log('✅ Updated Industrial Times default email to info@industrialtimes.in');
      }
    }

    console.log('✅ Checked and normalized image/video URLs in the database to relative paths');
  } catch (err) {
    console.error('⚠️ Failed to normalize image/video URLs in database:', err.message);
  }
};

// ─── EXPRESS ERROR MIDDLEWARE: Catch all route errors without crashing ───
app.use((err, req, res, next) => {
  console.error('🔴 EXPRESS ERROR:', err.message);
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Connect to Sequelize with retry logic ───
const connectWithRetry = async (retries = 5) => {
  for (let i = 0; i < retries; i++) {
    try {
      await sequelize.authenticate();
      console.log('✅ Database connected successfully.');
      return true;
    } catch (err) {
      console.error(`⚠️ DB connection attempt ${i + 1}/${retries} failed:`, err.message);
      if (i < retries - 1) {
        console.log('Retrying in 5 seconds...');
        await new Promise(r => setTimeout(r, 5000));
      }
    }
  }
  return false;
};

connectWithRetry().then(async (connected) => {
  if (!connected) {
    console.error('❌ Could not connect to database after retries. Starting server anyway...');
  }

  // Start listening immediately so the website is instantly online and Nginx proxy connects
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  if (connected) {
    // Run schema synchronization and seeding in the background so it doesn't block startup
    (async () => {
      try {
        console.log('Syncing database schema in background...');
        await sequelize.sync({ alter: true });
        console.log('✅ Database schema synchronized (alter: true) in background.');
      } catch (syncErr) {
        console.error('⚠️ Database schema sync failed:', syncErr.message);
      }

      try {
        await fixExistingImageUrls();
      } catch (err) {
        console.error('Background fixExistingImageUrls error:', err.message);
      }
      try {
        const PlatformSettings = require('./models/PlatformSettings');
        await PlatformSettings.seedDefaults();
        console.log('✅ Platform settings seeded/verified.');
      } catch (err) {
        console.error('⚠️ Could not seed platform settings:', err.message);
      }
    })();
  }
}).catch(err => {
  console.error('❌ Fatal error:', err);
});
