import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE from '../../config/api';

const ManageRevenue = ({ adminInfo: propAdminInfo }) => {
  const [activeSection, setActiveSection] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState({ text: '', type: '' });

  // Data states
  const [pendingPricings, setPendingPricings] = useState([]);
  const [allPricings, setAllPricings] = useState([]);
  const [revenueData, setRevenueData] = useState({ revenues: [], totals: {} });
  const [withdrawalData, setWithdrawalData] = useState({ withdrawals: [], summary: {} });
  const [platformSettings, setPlatformSettings] = useState({});
  const [editSettings, setEditSettings] = useState({});
  const [savingSettings, setSavingSettings] = useState(false);
  const [benefitsText, setBenefitsText] = useState('');

  // Admin adjustment
  const [adjustAmounts, setAdjustAmounts] = useState({});
  const [adminNotes, setAdminNotes] = useState({});

  const getAdminInfo = () => {
    if (propAdminInfo) return propAdminInfo;
    try {
      const mode = sessionStorage.getItem('portalMode');
      const saved = mode === 'user'
        ? localStorage.getItem('userInfo')
        : (localStorage.getItem('adminInfo') || localStorage.getItem('userInfo'));
      if (saved && saved !== 'undefined') {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.role === 'superadmin' || parsed.isManager)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  };
  const adminInfo = getAdminInfo();
  const config = { headers: { Authorization: `Bearer ${adminInfo?.token}` } };

  const showMsg = (text, type = 'success') => {
    setActionMsg({ text, type });
    setTimeout(() => setActionMsg({ text: '', type: '' }), 4000);
  };

  // ── Fetch Data ──────────────────────────────────────────────────
  const fetchAll = async () => {
    setLoading(true);
    try {
      const [pricingRes, allPricingRes, revenueRes, withdrawalRes, settingsRes] = await Promise.all([
        axios.get(`${API_BASE}/api/ad-pricing/all/pending`, config).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/api/ad-pricing/all/list`, config).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/api/revenue/all`, config).catch(() => ({ data: { revenues: [], totals: {} } })),
        axios.get(`${API_BASE}/api/withdrawals/all`, config).catch(() => ({ data: { withdrawals: [], summary: {} } })),
        axios.get(`${API_BASE}/api/platform-settings`, config).catch(() => ({ data: { settings: {} } })),
      ]);
      setPendingPricings(pricingRes.data || []);
      setAllPricings(allPricingRes.data || []);
      setRevenueData(revenueRes.data || { revenues: [], totals: {} });
      setWithdrawalData(withdrawalRes.data || { withdrawals: [], summary: {} });
      const s = settingsRes.data?.settings || {};
      setPlatformSettings(s);
      setEditSettings({
        min_withdrawal_amount: s.min_withdrawal_amount?.value || '5000',
        gst_rate: s.gst_rate?.value || '18',
        base_rate_leaderboard: s.base_rate_leaderboard?.value || '500',
        base_rate_right_half_page: s.base_rate_right_half_page?.value || '400',
        base_rate_article_inline: s.base_rate_article_inline?.value || '300',
        base_rate_left_skyscraper: s.base_rate_left_skyscraper?.value || '350',
        base_rate_top_bottom_banner: s.base_rate_top_bottom_banner?.value || '600',
        base_rate_popup: s.base_rate_popup?.value || '350',
        withdrawal_processing_hours: s.withdrawal_processing_hours?.value || '24',
        reporter_level_silver_followers: s.reporter_level_silver_followers?.value || '10',
        reporter_level_gold_followers: s.reporter_level_gold_followers?.value || '50',
        reporter_level_diamond_followers: s.reporter_level_diamond_followers?.value || '100',
        reporter_registration_fee: s.reporter_registration_fee?.value || '999',
        reporter_gst_rate: s.reporter_gst_rate?.value || '18',
      });
      const benefitsVal = s.reporter_benefits?.value || '["Earn up to 50% revenue share per article view","Build your personal brand with customized profile and followers","Access advanced analytics dashboard to track engagement","Gain recognition from top industrial leaders"]';
      try {
        const parsed = JSON.parse(benefitsVal);
        setBenefitsText(Array.isArray(parsed) ? parsed.join('\n') : benefitsVal);
      } catch (e) {
        setBenefitsText(benefitsVal);
      }
    } catch (err) { console.error('Fetch error', err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  // ── Pricing Actions ─────────────────────────────────────────────
  const handleConfirmPrice = async (id, originalBase) => {
    try {
      const finalAmount = adjustAmounts[id] || originalBase;
      await axios.patch(`${API_BASE}/api/ad-pricing/${id}/admin-confirm`, {
        finalAmount, adminNotes: adminNotes[id] || ''
      }, config);
      showMsg('✅ Price confirmed and sent to user for acceptance.');
      fetchAll();
    } catch (err) {
      showMsg(err.response?.data?.message || 'Failed to confirm price', 'danger');
    }
  };

  // ── Withdrawal Actions ──────────────────────────────────────────
  const handleWithdrawalAction = async (id, action) => {
    try {
      await axios.patch(`${API_BASE}/api/withdrawals/${id}/${action}`, {
        adminNotes: adminNotes[`w-${id}`] || ''
      }, config);
      showMsg(`✅ Withdrawal ${action}d successfully.`);
      fetchAll();
    } catch (err) {
      showMsg(err.response?.data?.message || `Failed to ${action}`, 'danger');
    }
  };

  // ── Save Settings ───────────────────────────────────────────────
  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const parsedBenefits = benefitsText.split('\n').map(b => b.trim()).filter(Boolean);
      const settingsToSave = {
        ...editSettings,
        reporter_benefits: JSON.stringify(parsedBenefits)
      };
      await axios.put(`${API_BASE}/api/platform-settings`, { settings: settingsToSave }, config);
      showMsg('✅ Platform settings updated successfully!');
      fetchAll();
    } catch (err) {
      showMsg(err.response?.data?.message || 'Failed to save settings', 'danger');
    } finally { setSavingSettings(false); }
  };

  const totals = revenueData.totals || {};
  const summary = withdrawalData.summary || {};
  const formatINR = (val) => `₹${(val || 0).toLocaleString('en-IN')}`;

  // ── Section Navigation ──────────────────────────────────────────
  const sections = [
    { id: 'overview', label: 'Revenue Overview', icon: 'bi-graph-up-arrow' },
    { id: 'pricing', label: `Pending Pricing (${pendingPricings.length})`, icon: 'bi-calculator' },
    { id: 'withdrawals', label: `Withdrawals (${summary.pendingCount || 0})`, icon: 'bi-cash-stack' },
    { id: 'settings', label: 'Monetization Settings', icon: 'bi-gear-fill' },
    { id: 'history', label: 'All Transactions', icon: 'bi-clock-history' },
  ];

  return (
    <div className="manage-ads-light">
      <div className="manage-ads-header">
        <div>
          <h2 className="manage-ads-title">
            <i className="bi bi-currency-rupee me-2" style={{ color: '#10b981' }}></i>
            Revenue & Billing Management
          </h2>
          <p className="manage-ads-subtitle">Manage ad pricing, revenue, withdrawals, and monetization settings.</p>
        </div>
      </div>

      {actionMsg.text && (
        <div className={`rev-alert rev-alert-${actionMsg.type}`}>
          {actionMsg.text}
        </div>
      )}

      {/* Section Tabs */}
      <div className="rev-tabs">
        {sections.map(s => (
          <button key={s.id} className={`rev-tab ${activeSection === s.id ? 'active' : ''}`} onClick={() => setActiveSection(s.id)}>
            <i className={`bi ${s.icon} me-1`}></i>{s.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
          <i className="bi bi-arrow-repeat" style={{ fontSize: '2rem', animation: 'spin 1s linear infinite' }}></i>
          <p>Loading revenue data...</p>
        </div>
      ) : (
        <>
          {/* ═══════════════ OVERVIEW ═══════════════ */}
          {activeSection === 'overview' && (
            <div>
              <div className="rev-stats-grid">
                <div className="rev-stat-card rev-stat-green">
                  <div className="rev-stat-icon"><i className="bi bi-currency-rupee"></i></div>
                  <div className="rev-stat-value">{formatINR(totals.totalRevenue)}</div>
                  <div className="rev-stat-label">Total Platform Revenue</div>
                </div>
                <div className="rev-stat-card rev-stat-blue">
                  <div className="rev-stat-icon"><i className="bi bi-receipt"></i></div>
                  <div className="rev-stat-value">{formatINR(totals.totalGst)}</div>
                  <div className="rev-stat-label">GST Collected (18%)</div>
                </div>
                <div className="rev-stat-card rev-stat-purple">
                  <div className="rev-stat-icon"><i className="bi bi-wallet2"></i></div>
                  <div className="rev-stat-value">{formatINR(totals.totalGross)}</div>
                  <div className="rev-stat-label">Total Gross (incl. GST)</div>
                </div>
                <div className="rev-stat-card rev-stat-orange">
                  <div className="rev-stat-icon"><i className="bi bi-cash-stack"></i></div>
                  <div className="rev-stat-value">{formatINR(summary.totalCompleted)}</div>
                  <div className="rev-stat-label">Total Withdrawn</div>
                </div>
                <div className="rev-stat-card rev-stat-amber">
                  <div className="rev-stat-icon"><i className="bi bi-hourglass-split"></i></div>
                  <div className="rev-stat-value">{pendingPricings.length}</div>
                  <div className="rev-stat-label">Pending Price Confirmations</div>
                </div>
                <div className="rev-stat-card rev-stat-red">
                  <div className="rev-stat-icon"><i className="bi bi-arrow-down-circle"></i></div>
                  <div className="rev-stat-value">{summary.pendingCount || 0}</div>
                  <div className="rev-stat-label">Pending Withdrawals</div>
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="rev-card" style={{ marginTop: '1.5rem' }}>
                <div className="rev-card-header"><h3><i className="bi bi-clock-history me-2"></i>Recent Transactions</h3></div>
                <div className="rev-card-body">
                  {(revenueData.revenues || []).length === 0 ? (
                    <p style={{ color: '#9ca3af', textAlign: 'center', padding: '2rem' }}>No transactions yet.</p>
                  ) : (
                    <table className="rev-table">
                      <thead><tr><th>Date</th><th>User</th><th>Type</th><th>Base</th><th>GST</th><th>Total</th><th>Status</th></tr></thead>
                      <tbody>
                        {(revenueData.revenues || []).slice(0, 10).map(r => (
                          <tr key={r.id}>
                            <td style={{ fontSize: '0.78rem', color: '#6b7280' }}>{new Date(r.createdAt).toLocaleDateString('en-IN')}</td>
                            <td style={{ fontWeight: 600 }}>{r.user?.name || 'Unknown'}</td>
                            <td><span className={`rev-type-badge ${r.type}`}>{r.type === 'ad_payment' ? 'Ad Payment' : r.type === 'article_reward' ? 'Article Reward' : r.type}</span></td>
                            <td>{formatINR(r.amount)}</td>
                            <td style={{ color: '#9ca3af' }}>{formatINR(r.gstAmount)}</td>
                            <td style={{ fontWeight: 700 }}>{formatINR(r.totalAmount)}</td>
                            <td><span className={`rev-status-badge ${r.status}`}>{r.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════ PENDING PRICING ═══════════════ */}
          {activeSection === 'pricing' && (
            <div>
              {pendingPricings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
                  <i className="bi bi-check-circle" style={{ fontSize: '3rem', color: '#10b981' }}></i>
                  <p style={{ marginTop: '0.5rem' }}>No pending pricing confirmations! All caught up.</p>
                </div>
              ) : (
                <div className="rev-pricing-list">
                  {pendingPricings.map(p => {
                    const factors = p.pricingFactors || {};
                    return (
                      <div key={p.id} className="rev-pricing-card">
                        <div className="rev-pricing-header">
                          <div>
                            <h4 style={{ margin: 0, fontWeight: 800 }}>
                              {p.adRequest?.adTitle || `Ad Request #${p.adRequestId}`}
                            </h4>
                            <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                              by {p.user?.name || 'Unknown'} ({p.user?.email}) • {new Date(p.createdAt).toLocaleDateString('en-IN')}
                            </span>
                          </div>
                          <div className="rev-pricing-badge">
                            <i className="bi bi-robot me-1"></i>AI Quote
                          </div>
                        </div>

                        {/* AI Factor Breakdown */}
                        <div className="rev-factors-grid">
                          {factors.slotPlacement && (
                            <div className="rev-factor">
                              <div className="rev-factor-icon"><i className="bi bi-layout-text-window"></i></div>
                              <div><strong>Slot</strong><br /><span>{factors.slotPlacement.description}</span></div>
                            </div>
                          )}
                          {factors.duration && (
                            <div className="rev-factor">
                              <div className="rev-factor-icon"><i className="bi bi-calendar-range"></i></div>
                              <div><strong>Duration</strong><br /><span>{factors.duration.description}</span></div>
                            </div>
                          )}
                          {factors.location && (
                            <div className="rev-factor">
                              <div className="rev-factor-icon"><i className="bi bi-geo-alt-fill"></i></div>
                              <div><strong>Location</strong><br /><span>{factors.location.description}</span></div>
                            </div>
                          )}
                          {factors.imageQuality && (
                            <div className="rev-factor">
                              <div className="rev-factor-icon"><i className="bi bi-image"></i></div>
                              <div><strong>Image Quality</strong><br /><span>{factors.imageQuality.label}</span></div>
                            </div>
                          )}
                          {factors.urlTrust && (
                            <div className="rev-factor">
                              <div className="rev-factor-icon"><i className="bi bi-link-45deg"></i></div>
                              <div><strong>URL Trust</strong><br /><span>{factors.urlTrust.label}</span></div>
                            </div>
                          )}
                        </div>

                        {/* Price Summary */}
                        <div className="rev-price-summary">
                          <div className="rev-price-row">
                            <span>AI Suggested Base Amount</span>
                            <span className="rev-price-val">{formatINR(p.baseAmount)}</span>
                          </div>
                          <div className="rev-price-row rev-price-gst">
                            <span>GST ({p.gstRate}%)</span>
                            <span>{formatINR(p.gstAmount)}</span>
                          </div>
                          <div className="rev-price-row rev-price-total">
                            <span>Total Payable</span>
                            <span>{formatINR(p.totalAmount)}</span>
                          </div>
                        </div>

                        {/* Admin Adjustment */}
                        <div className="rev-admin-actions">
                          <div className="rev-adjust-row">
                            <label>Adjust Amount (₹):</label>
                            <input
                              type="number"
                              placeholder={p.baseAmount}
                              value={adjustAmounts[p.id] || ''}
                              onChange={e => setAdjustAmounts({ ...adjustAmounts, [p.id]: e.target.value })}
                              style={{ width: '140px', padding: '6px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.85rem' }}
                            />
                            <input
                              type="text"
                              placeholder="Admin notes (optional)"
                              value={adminNotes[p.id] || ''}
                              onChange={e => setAdminNotes({ ...adminNotes, [p.id]: e.target.value })}
                              style={{ flex: 1, padding: '6px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.85rem' }}
                            />
                            <button className="rev-btn rev-btn-confirm" onClick={() => handleConfirmPrice(p.id, p.baseAmount)}>
                              <i className="bi bi-check-circle-fill me-1"></i>Confirm Price
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ═══════════════ WITHDRAWALS ═══════════════ */}
          {activeSection === 'withdrawals' && (
            <div>
              <div className="rev-stats-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="rev-stat-card rev-stat-amber">
                  <div className="rev-stat-value">{formatINR(summary.totalPending)}</div>
                  <div className="rev-stat-label">Pending ({summary.pendingCount || 0})</div>
                </div>
                <div className="rev-stat-card rev-stat-blue">
                  <div className="rev-stat-value">{formatINR(summary.totalApproved)}</div>
                  <div className="rev-stat-label">Approved / Processing</div>
                </div>
                <div className="rev-stat-card rev-stat-green">
                  <div className="rev-stat-value">{formatINR(summary.totalCompleted)}</div>
                  <div className="rev-stat-label">Completed</div>
                </div>
              </div>

              {(withdrawalData.withdrawals || []).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
                  <i className="bi bi-inbox" style={{ fontSize: '3rem' }}></i>
                  <p>No withdrawal requests yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {(withdrawalData.withdrawals || []).map(w => (
                    <div key={w.id} className="rev-withdrawal-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                          <h4 style={{ margin: 0, fontWeight: 800, fontSize: '1rem' }}>
                            {formatINR(w.amount)}
                            <span className={`rev-status-badge ${w.status}`} style={{ marginLeft: '10px' }}>{w.status.toUpperCase()}</span>
                          </h4>
                          <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: '4px' }}>
                            <span><i className="bi bi-person me-1"></i>{w.user?.name || w.userName || 'Unknown'}</span>
                            <span style={{ marginLeft: '12px' }}><i className="bi bi-envelope me-1"></i>{w.user?.email || w.userEmail}</span>
                            <span style={{ marginLeft: '12px' }}><i className="bi bi-credit-card me-1"></i>{w.paymentMethod || 'Bank Transfer'}</span>
                            <span style={{ marginLeft: '12px' }}><i className="bi bi-calendar3 me-1"></i>{new Date(w.requestedAt || w.createdAt).toLocaleDateString('en-IN')}</span>
                          </div>
                          {w.adminNotes && (
                            <div style={{ marginTop: '6px', padding: '6px 12px', background: '#f9fafb', borderRadius: '6px', fontSize: '0.78rem', color: '#6b7280' }}>
                              <i className="bi bi-chat-left-text me-1"></i><strong>Admin:</strong> {w.adminNotes}
                            </div>
                          )}
                        </div>

                        {w.status === 'pending' && (
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <input
                              type="text"
                              placeholder="Notes (optional)"
                              value={adminNotes[`w-${w.id}`] || ''}
                              onChange={e => setAdminNotes({ ...adminNotes, [`w-${w.id}`]: e.target.value })}
                              style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.82rem', width: '200px' }}
                            />
                            <button className="rev-btn rev-btn-confirm" onClick={() => handleWithdrawalAction(w.id, 'approve')}>
                              <i className="bi bi-check-circle-fill me-1"></i>Approve
                            </button>
                            <button className="rev-btn rev-btn-reject" onClick={() => handleWithdrawalAction(w.id, 'reject')}>
                              <i className="bi bi-x-circle-fill me-1"></i>Reject
                            </button>
                          </div>
                        )}

                        {w.status === 'approved' && (
                          <button className="rev-btn rev-btn-complete" onClick={() => handleWithdrawalAction(w.id, 'complete')}>
                            <i className="bi bi-check2-all me-1"></i>Mark Completed
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══════════════ SETTINGS ═══════════════ */}
          {activeSection === 'settings' && (
            <div className="rev-card">
              <div className="rev-card-header">
                <h3><i className="bi bi-gear-fill me-2" style={{ color: '#8b5cf6' }}></i>Monetization Settings</h3>
              </div>
              <div className="rev-card-body">
                <p style={{ color: '#6b7280', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Configure platform-wide pricing, GST, and withdrawal settings. Changes take effect immediately for new ad requests.</p>

                <div className="rev-settings-grid">
                  <div className="rev-setting-group">
                    <h4><i className="bi bi-cash-coin me-2"></i>Withdrawal Settings</h4>
                    <div className="rev-form-field">
                      <label>Minimum Withdrawal Amount (₹)</label>
                      <input type="number" value={editSettings.min_withdrawal_amount || ''} onChange={e => setEditSettings({ ...editSettings, min_withdrawal_amount: e.target.value })} />
                      <small>Users can only request withdrawal when balance reaches this amount.</small>
                    </div>
                    <div className="rev-form-field">
                      <label>Withdrawal Processing Hours</label>
                      <input type="number" value={editSettings.withdrawal_processing_hours || ''} onChange={e => setEditSettings({ ...editSettings, withdrawal_processing_hours: e.target.value })} />
                      <small>Hours to process withdrawal after admin approval.</small>
                    </div>
                  </div>

                  <div className="rev-setting-group">
                    <h4><i className="bi bi-receipt me-2"></i>Tax Settings</h4>
                    <div className="rev-form-field">
                      <label>GST Rate (%)</label>
                      <input type="number" value={editSettings.gst_rate || ''} onChange={e => setEditSettings({ ...editSettings, gst_rate: e.target.value })} />
                      <small>Goods and Services Tax percentage applied on ad pricing.</small>
                    </div>
                  </div>

                  <div className="rev-setting-group">
                    <h4><i className="bi bi-award me-2"></i>Reporter Levels (Followers)</h4>
                    <div className="rev-form-field">
                      <label>Silver Level Threshold</label>
                      <input type="number" value={editSettings.reporter_level_silver_followers || ''} onChange={e => setEditSettings({ ...editSettings, reporter_level_silver_followers: e.target.value })} />
                      <small>Followers needed to achieve Silver level status.</small>
                    </div>
                    <div className="rev-form-field">
                      <label>Gold Level Threshold</label>
                      <input type="number" value={editSettings.reporter_level_gold_followers || ''} onChange={e => setEditSettings({ ...editSettings, reporter_level_gold_followers: e.target.value })} />
                      <small>Followers needed to achieve Gold level status.</small>
                    </div>
                    <div className="rev-form-field">
                      <label>Diamond Level Threshold</label>
                      <input type="number" value={editSettings.reporter_level_diamond_followers || ''} onChange={e => setEditSettings({ ...editSettings, reporter_level_diamond_followers: e.target.value })} />
                      <small>Followers needed to achieve Diamond level status.</small>
                    </div>
                  </div>

                  <div className="rev-setting-group">
                    <h4><i className="bi bi-wallet2 me-2"></i>Reporter Fee Settings</h4>
                    <div className="rev-form-field">
                      <label>Reporter Fee (₹)</label>
                      <input type="number" value={editSettings.reporter_registration_fee || ''} onChange={e => setEditSettings({ ...editSettings, reporter_registration_fee: e.target.value })} />
                      <small>One-time registration fee for reporters (defaults to ₹999).</small>
                    </div>
                    <div className="rev-form-field">
                      <label>GST Rate (%)</label>
                      <input type="number" value={editSettings.reporter_gst_rate || ''} onChange={e => setEditSettings({ ...editSettings, reporter_gst_rate: e.target.value })} />
                      <small>GST percentage applied on the reporter fee.</small>
                    </div>
                    <div className="rev-form-field">
                      <label>Reporter Benefits (One per line)</label>
                      <textarea 
                        value={benefitsText} 
                        onChange={e => setBenefitsText(e.target.value)} 
                        rows={5} 
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.85rem', resize: 'none' }}
                      />
                      <small>List of benefits displayed in the payment modal.</small>
                    </div>
                  </div>

                  <div className="rev-setting-group rev-setting-full">
                    <h4><i className="bi bi-tags me-2"></i>Base Ad Rates (₹ per day per slot)</h4>
                    <div className="rev-rates-grid">
                      {[
                        { key: 'base_rate_leaderboard', label: 'Header Leaderboard (728×90)' },
                        { key: 'base_rate_right_half_page', label: 'Right Sidebar (300×600)' },
                        { key: 'base_rate_article_inline', label: 'Article Inline (728×90)' },
                        { key: 'base_rate_left_skyscraper', label: 'Left Skyscraper (160×600)' },
                        { key: 'base_rate_top_bottom_banner', label: 'Top-Bottom Banner (970×90)' },
                        { key: 'base_rate_popup', label: 'Popup (300×250)' },
                      ].map(r => (
                        <div key={r.key} className="rev-form-field">
                          <label>{r.label}</label>
                          <input type="number" value={editSettings[r.key] || ''} onChange={e => setEditSettings({ ...editSettings, [r.key]: e.target.value })} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '1.5rem' }}>
                  <button className="rev-btn rev-btn-confirm" onClick={handleSaveSettings} disabled={savingSettings} style={{ padding: '10px 32px', fontSize: '0.9rem' }}>
                    <i className="bi bi-save me-2"></i>{savingSettings ? 'Saving...' : 'Save All Settings'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════ HISTORY ═══════════════ */}
          {activeSection === 'history' && (
            <div className="rev-card">
              <div className="rev-card-header"><h3><i className="bi bi-clock-history me-2"></i>All Pricing History</h3></div>
              <div className="rev-card-body">
                {allPricings.length === 0 ? (
                  <p style={{ color: '#9ca3af', textAlign: 'center', padding: '2rem' }}>No pricing history yet.</p>
                ) : (
                  <table className="rev-table">
                    <thead>
                      <tr><th>Date</th><th>User</th><th>Ad</th><th>Base</th><th>GST</th><th>Total</th><th>Admin Final</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {allPricings.map(p => (
                        <tr key={p.id}>
                          <td style={{ fontSize: '0.78rem', color: '#6b7280' }}>{new Date(p.createdAt).toLocaleDateString('en-IN')}</td>
                          <td style={{ fontWeight: 600 }}>{p.user?.name || 'Unknown'}</td>
                          <td>{p.adRequest?.adTitle || `#${p.adRequestId || 'N/A'}`}</td>
                          <td>{formatINR(p.baseAmount)}</td>
                          <td style={{ color: '#9ca3af' }}>{formatINR(p.gstAmount)}</td>
                          <td>{formatINR(p.totalAmount)}</td>
                          <td style={{ fontWeight: 700, color: p.adminFinalAmount ? '#10b981' : '#9ca3af' }}>
                            {p.adminFinalAmount ? formatINR(p.adminTotalAmount) : '—'}
                          </td>
                          <td><span className={`rev-status-badge ${p.status}`}>{p.status.replace(/_/g, ' ')}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ManageRevenue;
