import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../../config/api';

const CorporateChoosePlan = () => {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [showTermsModal, setShowTermsModal] = useState(false);
  const [selectedPlanForTerms, setSelectedPlanForTerms] = useState(null);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [isCheckedRead, setIsCheckedRead] = useState(false);
  const [isCheckedConfirm, setIsCheckedConfirm] = useState(false);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    // Check if scrolled near the bottom (within 20px)
    if (scrollHeight - scrollTop - clientHeight < 20) {
      setHasScrolledToBottom(true);
    }
  };

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/api/plans`);
        if (data && data.length > 0) {
          setPlans(data.filter(p => p.active));
        } else {
          throw new Error('Empty response');
        }
      } catch (err) {
        console.warn('Failed to fetch plans, using fallback plans', err);
        // Fallback plans so the UI never looks empty if the database is offline
        const fallbackPlans = [
          {
            id: 1, planKey: 'basic', name: 'STARTER', priceMonthly: 2500, priceQuarterly: 7499, priceYearly: 29999,
            features: ['3 Articles per month', 'Basic brand listing', 'Email support'],
            color: '#60a5fa', icon: 'bi-briefcase', recommended: false, active: true,
            description: 'Perfect for small businesses getting started with media coverage'
          },
          {
            id: 2, planKey: 'standard', name: 'BUSINESS', priceMonthly: 4500, priceQuarterly: 13499, priceYearly: 53999,
            features: ['5 Articles per month', 'Brand promotion', 'Featured on homepage', 'Dedicated account manager', 'Newsletter placement', 'Social media shoutout'],
            color: '#3b82f6', icon: 'bi-building', recommended: false, active: true,
            description: 'Ideal for growing businesses seeking wider media reach'
          },
          {
            id: 3, planKey: 'premium', name: 'ENTERPRISE', priceMonthly: 9500, priceQuarterly: 28499, priceYearly: 113999,
            features: ['7 Articles per month', 'Premium brand promotion', 'Featured on homepage', 'Dedicated account manager', 'Newsletter placement', 'Social media campaign', '2 Banner Ad slots', 'Priority publishing'],
            color: '#8b5cf6', icon: 'bi-stars', recommended: true, active: true,
            description: 'For established enterprises needing maximum visibility'
          },
          {
            id: 4, planKey: 'pro', name: 'EXECUTIVE', priceMonthly: 20000, priceQuarterly: 59999, priceYearly: 239999,
            features: ['Unlimited Articles', 'Full brand campaign', 'Homepage takeover', 'Dedicated editorial team', 'Newsletter sponsorship', 'Multi-platform campaign', '4 Banner Ad slots', 'Become authorized Author', '1 Digital E-paper feature', 'Industry event access'],
            color: '#da251d', icon: 'bi-trophy', recommended: false, active: true,
            description: 'The ultimate corporate package with unlimited access'
          }
        ];
        setPlans(fallbackPlans);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const handleSelectPlan = (plan) => {
    setSelectedPlanForTerms(plan);
    setShowTermsModal(true);
    setHasScrolledToBottom(false);
    setIsCheckedRead(false);
    setIsCheckedConfirm(false);
  };

  const handleAcceptTerms = () => {
    if (selectedPlanForTerms) {
      setShowTermsModal(false);
      navigate(`/corporate/login?plan=${selectedPlanForTerms.planKey}`);
    }
  };

  const getPrice = (plan) => {
    if (billingCycle === 'monthly') return plan.priceMonthly;
    if (billingCycle === 'quarterly') return plan.priceQuarterly;
    return plan.priceYearly;
  };

  const getPeriod = () => {
    if (billingCycle === 'monthly') return '/mo';
    if (billingCycle === 'quarterly') return '/qtr';
    return '/yr';
  };

  return (
    <>
      {/* Terms of Use Modal for Corporate Plan Registration */}
      {showTermsModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(10px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, color: '#fff', padding: '1rem'
        }}>
          <div style={{
            background: 'linear-gradient(145deg, #1e293b, #0f172a)',
            padding: '2rem', borderRadius: '24px', maxWidth: '600px', width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.1)',
            display: 'flex', flexDirection: 'column', maxHeight: '95vh'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, color: '#f8fafc' }}>
                Corporate Terms of Use
              </h3>
              <button 
                type="button"
                onClick={() => {
                  setShowTermsModal(false);
                  setSelectedPlanForTerms(null);
                }}
                style={{
                  background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer'
                }}
              >
                &times;
              </button>
            </div>

            <div 
              onScroll={handleScroll}
              style={{
                overflowY: 'auto', maxHeight: '50vh', padding: '1.2rem',
                background: 'rgba(0, 0, 0, 0.25)', borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.05)', textAlign: 'left'
              }}
            >
              <style dangerouslySetInnerHTML={{ __html: `
                .corporate-terms-box p, .corporate-terms-box ul, .corporate-terms-box li, .corporate-terms-box span {
                  font-size: 8pt !important;
                  line-height: 1.4;
                  color: #cbd5e1 !important;
                }
                .corporate-terms-box h2, .corporate-terms-box h3, .corporate-terms-box h4 {
                  font-size: 10pt !important;
                  font-weight: bold;
                  margin-top: 15px;
                  margin-bottom: 8px;
                  color: #f8fafc !important;
                }
              ` }} />
              <div className="corporate-terms-box">
                <h2>Corporate Terms of Use</h2>
                <p><strong>Last Updated: June 2026</strong></p>
                
                <h2>1. Introduction</h2>
                <p>Welcome to Industrial Times Corporate Services. These Corporate Terms of Use govern the purchase and use of advertising, promotional, branding, media, public relations, interview, sponsored content, event coverage, lead generation, and other business services offered by Industrial Times. By purchasing or using any corporate service from Industrial Times, the client agrees to these Terms of Use.</p>

                <h2>2. About Industrial Times</h2>
                <p>Industrial Times is a digital news and media platform providing industry news, business insights, startup coverage, technology updates, corporate interviews, promotional campaigns, and digital media solutions for organizations across various sectors.</p>

                <h2>3. Service Scope</h2>
                <p>Corporate services may include:</p>
                <ul>
                  <li>Sponsored Articles</li>
                  <li>Press Release Publishing</li>
                  <li>Corporate Interviews</li>
                  <li>Brand Promotion Campaigns</li>
                  <li>Social Media Promotion</li>
                  <li>Event Coverage</li>
                  <li>Video and Podcast Features</li>
                  <li>Business Listing Services</li>
                  <li>Banner Advertising</li>
                  <li>Lead Generation Campaigns</li>
                  <li>Industry Recognition Programs</li>
                  <li>Customized Marketing Solutions</li>
                </ul>
                <p>Industrial Times reserves the right to modify, expand, or discontinue services without prior notice.</p>

                <h2>4. Client Responsibilities</h2>
                <p>Clients agree to:</p>
                <ul>
                  <li>Provide accurate and lawful information.</li>
                  <li>Submit content that does not violate intellectual property rights.</li>
                  <li>Ensure all claims, data, and promotional materials are truthful and verifiable.</li>
                  <li>Obtain necessary permissions, licenses, and approvals for submitted content.</li>
                </ul>
                <p>Clients shall be solely responsible for the accuracy of information provided.</p>

                <h2>5. Content Review and Approval</h2>
                <p>Industrial Times reserves the right to:</p>
                <ul>
                  <li>Review submitted content before publication.</li>
                  <li>Edit content for grammar, formatting, clarity, and compliance.</li>
                  <li>Reject content that is misleading, defamatory, illegal, offensive, or inconsistent with editorial standards.</li>
                  <li>Request supporting documents for factual verification.</li>
                </ul>
                <p>Publication is subject to editorial review and approval.</p>

                <h2>6. Sponsored and Promotional Content</h2>
                <p>Sponsored content, advertisements, and promotional campaigns may be clearly identified as:</p>
                <ul>
                  <li>Sponsored</li>
                  <li>Promotional</li>
                  <li>Partner Content</li>
                  <li>Advertisement</li>
                  <li>Brand Feature</li>
                </ul>
                <p>Industrial Times maintains the right to ensure transparency for readers regarding paid content.</p>

                <h2>7. Payment Terms</h2>
                <ul>
                  <li>All service fees must be paid according to the agreed proposal, quotation, invoice, or subscription plan.</li>
                  <li>Services may commence only after payment confirmation unless otherwise agreed in writing.</li>
                  <li>Payments made are generally non-refundable once work has commenced.</li>
                  <li>Any applicable taxes shall be borne by the client.</li>
                </ul>

                <h2>8. Cancellation and Refund Policy</h2>
                <ul>
                  <li>Cancellation requests must be submitted in writing.</li>
                  <li>Refund eligibility will depend on the stage of service delivery.</li>
                  <li>No refunds shall be issued for completed publications, promotional campaigns, or services already delivered.</li>
                  <li>Industrial Times reserves the right to determine refund eligibility on a case-by-case basis.</li>
                </ul>

                <h2>9. Intellectual Property</h2>
                <p>Clients retain ownership of their trademarks, logos, and submitted materials. By engaging Industrial Times services, clients grant Industrial Times permission to:</p>
                <ul>
                  <li>Publish submitted content.</li>
                  <li>Display company logos and promotional materials.</li>
                  <li>Use campaign materials for service execution and portfolio purposes unless otherwise agreed.</li>
                </ul>

                <h2>10. Prohibited Activities</h2>
                <p>Clients shall not use Industrial Times services to:</p>
                <ul>
                  <li>Promote illegal products or services.</li>
                  <li>Publish false or misleading information.</li>
                  <li>Engage in fraud, spam, or deceptive marketing practices.</li>
                  <li>Violate applicable laws or regulations.</li>
                  <li>Infringe third-party intellectual property rights.</li>
                </ul>
                <p>Industrial Times may terminate services immediately upon discovering violations.</p>

                <h2>11. Limitation of Liability</h2>
                <p>Industrial Times shall not be liable for:</p>
                <ul>
                  <li>Business losses.</li>
                  <li>Revenue loss.</li>
                  <li>Indirect or consequential damages.</li>
                  <li>Decisions made by third parties based on published content.</li>
                  <li>Search engine ranking fluctuations.</li>
                  <li>Social media algorithm changes.</li>
                </ul>
                <p>All services are provided on a commercially reasonable effort basis.</p>

                <h2>12. Service Availability</h2>
                <p>While Industrial Times strives to provide uninterrupted services, we do not guarantee continuous availability of:</p>
                <ul>
                  <li>Website services</li>
                  <li>Advertising systems</li>
                  <li>Social media platforms</li>
                  <li>Third-party integrations</li>
                </ul>
                <p>Temporary interruptions may occur due to maintenance, technical issues, or circumstances beyond our control.</p>

                <h2>13. Indemnification</h2>
                <p>Clients agree to indemnify and hold harmless Industrial Times, its management, employees, editors, partners, and affiliates from any claims, liabilities, damages, losses, or legal expenses arising from submitted content or misuse of services.</p>

                <h2>14. Modification of Terms</h2>
                <p>Industrial Times reserves the right to update these Terms of Use at any time. Continued use of corporate services constitutes acceptance of any revised terms.</p>

                <h2>15. Contact Information</h2>
                <p>
                  <strong>Industrial Times</strong><br/>
                  Website: https://industrialtimes.in<br/>
                  Email: info@industrialtimes.in<br/>
                  Phone: +91 7903451885<br/>
                  Address: H.No. 79, Teachers Colony, Dimna Road, Mango, Jamshedpur, Jharkhand – 831012, India.
                </p>

                <h2>16. Acceptance of Terms</h2>
                <p>By purchasing, subscribing to, or using any corporate service offered by Industrial Times, the client acknowledges that they have read, understood, and agreed to these Corporate Terms of Use.</p>
              </div>
            </div>

            {/* Scroll Notice */}
            {!hasScrolledToBottom && (
              <div style={{ fontSize: '0.75rem', color: '#fbbf24', textAlign: 'center', marginTop: '0.8rem' }}>
                <i className="bi bi-arrow-down-circle me-1"></i> Please scroll to the bottom to confirm terms.
              </div>
            )}

            {/* Verification Checkboxes - Displayed only when user has scrolled to the bottom */}
            {hasScrolledToBottom && (
              <div style={{
                display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '1rem',
                textAlign: 'left', width: '100%', padding: '10px 15px', borderRadius: '12px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.75rem', cursor: 'pointer', color: '#cbd5e1', marginBottom: 0 }}>
                  <input
                    type="checkbox"
                    checked={isCheckedRead}
                    onChange={(e) => setIsCheckedRead(e.target.checked)}
                    style={{ width: '16px', height: '16px', marginTop: '1px', cursor: 'pointer', accentColor: '#da251d' }}
                  />
                  <span>I have read the Corporate Terms of Use.</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.75rem', cursor: 'pointer', color: '#cbd5e1', marginBottom: 0 }}>
                  <input
                    type="checkbox"
                    checked={isCheckedConfirm}
                    onChange={(e) => setIsCheckedConfirm(e.target.checked)}
                    style={{ width: '16px', height: '16px', marginTop: '1px', cursor: 'pointer', accentColor: '#da251d' }}
                  />
                  <span>I agree to confirm and abide by all corporate policies.</span>
                </label>
              </div>
            )}

            {/* Action Buttons - Enabled only when scrolled to bottom and checkboxes checked */}
            <div style={{
              display: 'flex', marginTop: '1.2rem', width: '100%',
              opacity: (hasScrolledToBottom && isCheckedRead && isCheckedConfirm) ? 1 : 0.5,
              pointerEvents: (hasScrolledToBottom && isCheckedRead && isCheckedConfirm) ? 'auto' : 'none',
              transition: 'all 0.3s ease'
            }}>
              <button
                type="button"
                onClick={handleAcceptTerms}
                style={{
                  background: '#da251d', color: '#fff', border: 'none',
                  padding: '12px 24px', borderRadius: '12px', fontSize: '0.9rem', fontWeight: '700', cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(218, 37, 29, 0.2)', width: '100%', textAlign: 'center',
                  transition: 'background 0.2s'
                }}
              >
                Confirm &amp; Accept
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="corporate-choose-plan-page">
      {/* Floating Background Elements */}
      <div className="corp-bg-shapes">
        <div className="corp-bg-shape corp-bg-shape-1"></div>
        <div className="corp-bg-shape corp-bg-shape-2"></div>
        <div className="corp-bg-shape corp-bg-shape-3"></div>
      </div>

      {/* Header */}
      <div className="corp-plan-header">
        <div className="corp-plan-logo">
          <Link to="/">
            <img src="/industrialtimes_white.png" alt="Industrial Times" style={{ height: '40px', width: 'auto' }} />
          </Link>
        </div>
        <div className="corp-plan-badge">CORPORATE PORTAL</div>
        <h1 className="corp-plan-title">Choose Your Corporate Plan</h1>
        <p className="corp-plan-subtitle">
          Empower your brand with Industrial Times' premium corporate publishing solutions. 
          Select a plan that fits your business goals.
        </p>

        {/* Billing Cycle Toggle */}
        <div className="corp-billing-toggle">
          <button 
            className={`corp-billing-btn ${billingCycle === 'monthly' ? 'active' : ''}`}
            onClick={() => setBillingCycle('monthly')}
          >
            Monthly
          </button>
          <button 
            className={`corp-billing-btn ${billingCycle === 'quarterly' ? 'active' : ''}`}
            onClick={() => setBillingCycle('quarterly')}
          >
            Quarterly
            <span className="corp-discount-badge">5% OFF</span>
          </button>
          <button 
            className={`corp-billing-btn ${billingCycle === 'yearly' ? 'active' : ''}`}
            onClick={() => setBillingCycle('yearly')}
          >
            Yearly
            <span className="corp-discount-badge">10% OFF</span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-light" role="status"></div>
          <p className="text-white-50 mt-3">Loading plans...</p>
        </div>
      ) : (
        <div className="corp-plans-grid" style={{ gridTemplateColumns: `repeat(${Math.min(plans.length, 4)}, 1fr)` }}>
          {plans.map((plan) => (
            <div 
              key={plan.id} 
              className={`corp-plan-card ${plan.recommended ? 'corp-recommended' : ''}`}
            >
              {plan.recommended && (
                <div className="corp-recommended-banner">
                  <i className="bi bi-star-fill"></i> MOST POPULAR
                </div>
              )}
              <div className="corp-plan-card-header" style={{ borderColor: plan.color }}>
                <div className="corp-plan-icon" style={{ background: plan.color }}>
                  <i className={`bi ${plan.icon}`}></i>
                </div>
                <h3 className="corp-plan-name">{plan.name}</h3>
                {plan.description && (
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '12px', lineHeight: 1.4 }}>{plan.description}</p>
                )}
                <div className="corp-plan-price">
                  <span className="corp-price-currency">₹</span>
                  <span className="corp-price-amount">{getPrice(plan).toLocaleString()}</span>
                  <span className="corp-price-period">{getPeriod()}</span>
                </div>
              </div>
              <div className="corp-plan-features">
                {(plan.features || []).map((feature, idx) => (
                  <div key={idx} className="corp-feature-item">
                    <i className="bi bi-check-circle-fill" style={{ color: plan.color }}></i>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
              <button 
                className={`corp-select-plan-btn ${plan.recommended ? 'corp-select-recommended' : ''}`}
                style={{ 
                  background: plan.recommended ? plan.color : 'transparent',
                  borderColor: plan.color,
                  color: plan.recommended ? '#fff' : plan.color 
                }}
                onClick={() => handleSelectPlan(plan)}
              >
                Get Started <i className="bi bi-arrow-right"></i>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Trust Section */}
      <div className="corp-trust-section">
        <div className="corp-trust-item">
          <i className="bi bi-shield-check"></i>
          <span>Secure & Verified</span>
        </div>
        <div className="corp-trust-item">
          <i className="bi bi-headset"></i>
          <span>24/7 Support</span>
        </div>
        <div className="corp-trust-item">
          <i className="bi bi-arrow-repeat"></i>
          <span>Cancel Anytime</span>
        </div>
        <div className="corp-trust-item">
          <i className="bi bi-building"></i>
          <span>500+ Corporates Trust Us</span>
        </div>
      </div>

      <div className="corp-plan-footer">
        © {new Date().getFullYear()} Industrial Times. All rights reserved.
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .corporate-choose-plan-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
          color: #f8fafc;
          padding: 40px 20px 60px;
          position: relative;
          overflow: hidden;
          font-family: 'Inter', sans-serif;
        }

        /* Floating Background */
        .corp-bg-shapes { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
        .corp-bg-shape { position: absolute; border-radius: 50%; opacity: 0.06; }
        .corp-bg-shape-1 { width: 600px; height: 600px; background: #da251d; top: -200px; right: -200px; animation: corpFloat1 15s ease-in-out infinite; }
        .corp-bg-shape-2 { width: 400px; height: 400px; background: #3b82f6; bottom: -100px; left: -100px; animation: corpFloat2 18s ease-in-out infinite; }
        .corp-bg-shape-3 { width: 300px; height: 300px; background: #8b5cf6; top: 50%; left: 50%; animation: corpFloat3 12s ease-in-out infinite; }
        @keyframes corpFloat1 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(-60px, 80px); } }
        @keyframes corpFloat2 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(50px, -60px); } }
        @keyframes corpFloat3 { 0%,100% { transform: translate(-50%,-50%) scale(1); } 50% { transform: translate(-50%,-50%) scale(1.2); } }

        /* Header */
        .corp-plan-header {
          text-align: center;
          max-width: 700px;
          margin: 0 auto 50px;
          position: relative;
          z-index: 2;
        }
        .corp-plan-logo { margin-bottom: 20px; }
        .corp-plan-badge {
          display: inline-block;
          background: rgba(218, 37, 29, 0.15);
          color: #da251d;
          padding: 6px 20px;
          border-radius: 30px;
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 2px;
          border: 1px solid rgba(218, 37, 29, 0.3);
          margin-bottom: 20px;
        }
        .corp-plan-title {
          font-size: 2.5rem;
          font-weight: 900;
          margin-bottom: 16px;
          background: linear-gradient(135deg, #fff, #94a3b8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          line-height: 1.2;
        }
        .corp-plan-subtitle {
          font-size: 1rem;
          color: #94a3b8;
          line-height: 1.7;
        }

        /* Billing Toggle */
        .corp-billing-toggle {
          display: inline-flex;
          gap: 8px;
          background: rgba(255,255,255,0.05);
          padding: 6px;
          border-radius: 14px;
          margin-top: 24px;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .corp-billing-btn {
          padding: 10px 24px;
          border: none;
          border-radius: 10px;
          background: transparent;
          color: #94a3b8;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
          position: relative;
        }
        .corp-billing-btn.active {
          background: #da251d;
          color: #fff;
          box-shadow: 0 4px 15px rgba(218, 37, 29, 0.4);
        }
        .corp-discount-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          background: #10b981;
          color: #fff;
          font-size: 0.55rem;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 8px;
        }

        /* Plans Grid */
        .corp-plans-grid {
          display: grid;
          gap: 24px;
          max-width: 1200px;
          margin: 0 auto;
          position: relative;
          z-index: 2;
        }
        @media (max-width: 1100px) { .corp-plans-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 600px) { .corp-plans-grid { grid-template-columns: 1fr !important; max-width: 400px; } }

        /* Plan Card */
        .corp-plan-card {
          background: rgba(30, 41, 59, 0.8);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 0;
          display: flex;
          flex-direction: column;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          backdrop-filter: blur(10px);
          position: relative;
        }
        .corp-plan-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
          border-color: rgba(255,255,255,0.15);
        }
        .corp-recommended {
          border-color: rgba(139, 92, 246, 0.4);
          box-shadow: 0 0 30px rgba(139, 92, 246, 0.15);
        }
        .corp-recommended-banner {
          background: linear-gradient(135deg, #8b5cf6, #a78bfa);
          color: #fff;
          text-align: center;
          padding: 8px;
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .corp-plan-card-header {
          padding: 28px 24px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .corp-plan-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.3rem;
          color: #fff;
          margin-bottom: 16px;
        }
        .corp-plan-name {
          font-size: 0.85rem;
          font-weight: 800;
          letter-spacing: 1.5px;
          color: #94a3b8;
          margin-bottom: 8px;
        }
        .corp-plan-price { display: flex; align-items: baseline; gap: 2px; }
        .corp-price-currency { font-size: 1.2rem; font-weight: 700; color: #f8fafc; }
        .corp-price-amount { font-size: 2.2rem; font-weight: 900; color: #f8fafc; line-height: 1; }
        .corp-price-period { font-size: 0.8rem; color: #64748b; margin-left: 4px; }

        /* Features */
        .corp-plan-features {
          padding: 20px 24px;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .corp-feature-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.82rem;
          color: #cbd5e1;
          font-weight: 500;
        }
        .corp-feature-item i { font-size: 0.85rem; flex-shrink: 0; }

        /* Button */
        .corp-select-plan-btn {
          margin: 0 24px 24px;
          padding: 14px;
          border: 2px solid;
          border-radius: 12px;
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .corp-select-plan-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.2);
          filter: brightness(1.1);
        }
        .corp-select-recommended {
          animation: corpPulse 2s infinite;
        }
        @keyframes corpPulse {
          0% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(139, 92, 246, 0); }
          100% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0); }
        }

        /* Trust Section */
        .corp-trust-section {
          display: flex;
          justify-content: center;
          gap: 40px;
          margin-top: 60px;
          padding: 30px;
          position: relative;
          z-index: 2;
          flex-wrap: wrap;
        }
        .corp-trust-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.85rem;
          color: #64748b;
          font-weight: 600;
        }
        .corp-trust-item i { font-size: 1.2rem; color: #10b981; }

        /* Footer */
        .corp-plan-footer {
          text-align: center;
          margin-top: 40px;
          font-size: 0.75rem;
          color: #475569;
          position: relative;
          z-index: 2;
        }
      `}} />
      </div>
    </>
  );
};

export default CorporateChoosePlan;
