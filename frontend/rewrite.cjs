const fs = require('fs');
let css = fs.readFileSync('src/admin-light.css', 'utf8');

// Replace light backgrounds with dark glass backgrounds
css = css.replace(/background:\s*#fff(fff)?/g, "background: rgba(30, 41, 59, 0.7)");
css = css.replace(/background-color:\s*#fff(fff)?/g, "background-color: rgba(30, 41, 59, 0.7)");
css = css.replace(/background:\s*#f8f9fb/g, "background: #0f172a");
css = css.replace(/background:\s*#fdfdfd/g, "background: transparent");
css = css.replace(/background:\s*#f5f5f5/g, "background: rgba(255,255,255,0.05)");
css = css.replace(/background-color:\s*#f8f9fa/g, "background-color: rgba(255,255,255,0.05)");

// Borders
css = css.replace(/border:\s*1px solid #eee/g, "border: 1px solid rgba(255,255,255,0.1)");
css = css.replace(/border-color:\s*#eee/g, "border-color: rgba(255,255,255,0.1)");
css = css.replace(/border-bottom:\s*1px solid #f0f0f0/g, "border-bottom: 1px solid rgba(255,255,255,0.1)");
css = css.replace(/border-right:\s*1px solid #eee/g, "border-right: 1px solid rgba(255,255,255,0.1)");
css = css.replace(/border:\s*1px solid #e8e8e8/g, "border: 1px solid rgba(255,255,255,0.1)");
css = css.replace(/border-bottom:\s*1px solid #eee/g, "border-bottom: 1px solid rgba(255,255,255,0.1)");

// Text Colors
css = css.replace(/color:\s*#111/g, "color: #f8fafc");
css = css.replace(/color:\s*#333/g, "color: #e2e8f0");
css = css.replace(/color:\s*#444/g, "color: #cbd5e1");
css = css.replace(/color:\s*#555/g, "color: #94a3b8");
css = css.replace(/color:\s*#666/g, "color: #94a3b8");
css = css.replace(/color:\s*#888/g, "color: #64748b");
css = css.replace(/color:\s*#999/g, "color: #64748b");
css = css.replace(/color:\s*#aaa/g, "color: #64748b");
css = css.replace(/color:\s*#1a1a1a/g, "color: #f8fafc");

// Specific dark mode tweaks
css += `
/* --- MODERN DARK MODE OVERRIDES --- */
.admin-light-layout { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #f8fafc; }
.admin-light-sidebar, .new-admin-topbar { background: rgba(15, 23, 42, 0.7) !important; backdrop-filter: blur(16px); }
.new-card, .new-stat-card, .admin-card, .manage-article-card, .publish-modal, .admin-dropdown-menu, .stat-modal-content, .manage-ads-table-wrap, .manage-ads-slot-card, .admin-profile-card, .modern-table-container { 
  background: rgba(30, 41, 59, 0.7) !important; 
  backdrop-filter: blur(12px); 
  border: 1px solid rgba(255,255,255,0.1) !important; 
  box-shadow: 0 8px 32px rgba(0,0,0,0.3) !important;
  color: #f8fafc !important;
}
.manage-article-card { background: rgba(30, 41, 59, 0.7) !important; }
.publish-settings-card { background: rgba(15, 23, 42, 0.5) !important; border: 1px solid rgba(255,255,255,0.1) !important; }
.admin-nav-item:hover { background: rgba(255,255,255,0.08) !important; color: #fff !important; }
.admin-nav-item.active { background: rgba(218, 37, 29, 0.15) !important; color: #da251d !important; border-left: 3px solid #da251d; }
.new-search-box input { color: #f8fafc !important; }
.publish-field input, .publish-field textarea, .publish-field select { background: rgba(15, 23, 42, 0.6) !important; color: #f8fafc !important; border: 1px solid rgba(255,255,255,0.2) !important; }
.manage-cat-chip { background: rgba(30, 41, 59, 0.6) !important; color: #94a3b8 !important; border: 1px solid rgba(255,255,255,0.1) !important; }
.manage-cat-chip.active, .manage-cat-chip:hover { background: #da251d !important; color: #fff !important; border-color: #da251d !important; }
.admin-table tbody tr:hover, .modern-table tbody tr:hover { background: rgba(255,255,255,0.05) !important; }
.auth-split-left { background: linear-gradient(145deg, #0f172a 0%, #1e293b 100%) !important; }
.auth-split-right { background: linear-gradient(-45deg, #0f172a, #1e293b, #09090b, #111827) !important; background-size: 400% 400%; }
.auth-form-container { background: rgba(30, 41, 59, 0.8) !important; backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); color: #f8fafc; }
.auth-form-title, .auth-brand-tagline, .auth-brand-title { color: #f8fafc !important; }
.auth-brand-desc { color: #94a3b8 !important; }
.auth-input { background: rgba(15, 23, 42, 0.6) !important; color: #f8fafc !important; border: 1px solid rgba(255,255,255,0.2) !important; }
.auth-input:focus { border-color: #da251d !important; background: rgba(15, 23, 42, 0.9) !important; box-shadow: 0 0 0 3px rgba(218, 37, 29, 0.2) !important; }
.auth-social-btn { background: rgba(255,255,255,0.05) !important; color: #e2e8f0 !important; border: 1px solid rgba(255,255,255,0.1) !important; }
.auth-role-label { color: #cbd5e1 !important; border-color: rgba(255,255,255,0.1) !important; }
.auth-role-label:has(input:checked) { border-color: #da251d !important; background: rgba(218, 37, 29, 0.1) !important; }
.category-tab { background: rgba(30, 41, 59, 0.6) !important; color: #94a3b8 !important; border: 1px solid rgba(255,255,255,0.1) !important; }
.category-tab:hover, .category-tab.active { background: #da251d !important; color: #fff !important; border-color: #da251d !important; }
.new-stat-value, .new-stock-value, .new-page-title, .new-card-header h3, .manage-news-title, .admin-page-title { color: #f8fafc !important; }
.admin-sidebar-logo-img { filter: invert(1) brightness(2); }
.stat-modal-main-value h1 { color: #f8fafc !important; }
.stat-modal-title-group h3 { color: #f8fafc !important; }
.manage-ads-table-title { color: #f8fafc !important; }
.new-promo-card { background: linear-gradient(135deg, rgba(79, 70, 229, 0.2), rgba(139, 92, 246, 0.2)) !important; border: 1px solid rgba(99, 102, 241, 0.3); }
.new-promo-card h3 { color: #f8fafc !important; }
.new-promo-card p { color: #cbd5e1 !important; }
.admin-table thead th, .modern-table th { background-color: rgba(15, 23, 42, 0.8) !important; color: #94a3b8 !important; border-bottom: 1px solid rgba(255,255,255,0.1) !important; }
.admin-table td, .modern-table td { color: #cbd5e1 !important; border-bottom: 1px solid rgba(255,255,255,0.05) !important; }
.admin-table-title { color: #f8fafc !important; }
.manage-article-title { color: #f8fafc !important; }
.publish-modal-title-row h2 { color: #f8fafc !important; }
.manage-ads-slot-label { color: #f8fafc !important; }
.admin-logout-btn { background: rgba(255,255,255,0.05) !important; color: #e2e8f0 !important; border: 1px solid rgba(255,255,255,0.1) !important; }
.admin-logout-btn:hover { background: rgba(220, 38, 38, 0.1) !important; color: #ef4444 !important; border-color: rgba(220, 38, 38, 0.3) !important; }
.auth-submit-btn { background: #da251d !important; color: #fff !important; }
.auth-submit-btn:hover { background: #b91c1c !important; }
.manage-empty { background: rgba(30, 41, 59, 0.4) !important; border: 1px dashed rgba(255,255,255,0.2) !important; }
.manage-empty h3 { color: #f8fafc !important; }
.manage-empty p { color: #94a3b8 !important; }
`;

fs.writeFileSync('src/admin-light.css', css);
