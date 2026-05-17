import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../../config/api';

const CorporateChoosePlan = () => {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/api/plans`);
        // Only show active plans
        setPlans((data || []).filter(p => p.active));
      } catch (err) {
        console.error('Failed to fetch plans', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const handleSelectPlan = (plan) => {
    navigate(`/corporate/login?plan=${plan.planKey}`);
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
          <img src="/industrialtimes_white.png" alt="Industrial Times" style={{ height: '40px', width: 'auto' }} />
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
            <span className="corp-discount-badge">8% OFF</span>
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
        © {new Date().getFullYear()} Industrial Times Networks. All rights reserved.
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
  );
};

export default CorporateChoosePlan;
