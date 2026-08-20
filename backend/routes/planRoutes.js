const express = require('express');
const router = Router = express.Router();
const Plan = require('../models/Plan');

const defaultPlans = [
  {
    planKey: 'basic', name: 'STARTER', priceMonthly: 2500, priceQuarterly: 7499, priceYearly: 29999,
    features: ['3 Articles per month', 'Basic brand listing', 'Email support'],
    color: '#60a5fa', icon: 'bi-briefcase', recommended: false, active: true, sortOrder: 1,
    description: 'Perfect for small businesses getting started with media coverage'
  },
  {
    planKey: 'standard', name: 'BUSINESS', priceMonthly: 4500, priceQuarterly: 13499, priceYearly: 53999,
    features: ['5 Articles per month', 'Brand promotion', 'Featured on homepage', 'Dedicated account manager', 'Newsletter placement', 'Social media shoutout'],
    color: '#3b82f6', icon: 'bi-building', recommended: false, active: true, sortOrder: 2,
    description: 'Ideal for growing businesses seeking wider media reach'
  },
  {
    planKey: 'premium', name: 'ENTERPRISE', priceMonthly: 9500, priceQuarterly: 28499, priceYearly: 113999,
    features: ['7 Articles per month', 'Premium brand promotion', 'Featured on homepage', 'Dedicated account manager', 'Newsletter placement', 'Social media campaign', '2 Banner Ad slots', 'Priority publishing'],
    color: '#8b5cf6', icon: 'bi-stars', recommended: true, active: true, sortOrder: 3,
    description: 'For established enterprises needing maximum visibility'
  },
  {
    planKey: 'pro', name: 'EXECUTIVE', priceMonthly: 20000, priceQuarterly: 59999, priceYearly: 239999,
    features: ['Unlimited Articles', 'Full brand campaign', 'Homepage takeover', 'Dedicated editorial team', 'Newsletter sponsorship', 'Multi-platform campaign', '4 Banner Ad slots', 'Become authorized Author', '1 Digital E-paper feature', 'Industry event access'],
    color: '#da251d', icon: 'bi-trophy', recommended: false, active: true, sortOrder: 4,
    description: 'The ultimate corporate package with unlimited access'
  }
];

// GET /api/plans
router.get('/', async (req, res) => {
  try {
    let plans = await Plan.findAll({ order: [['sortOrder', 'ASC']] });

    if (plans.length === 0) {
      for (const plan of defaultPlans) {
        await Plan.create(plan);
      }
      plans = await Plan.findAll({ order: [['sortOrder', 'ASC']] });
    }

    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/plans/:id
router.get('/:id', async (req, res) => {
  try {
    const plan = await Plan.findByPk(req.params.id);
    if (!plan) return res.status(404).json({ message: 'Plan not found' });
    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/plans
router.post('/', async (req, res) => {
  try {
    const { planKey, name, priceMonthly, priceQuarterly, priceYearly, features, color, icon, recommended, active, sortOrder, description } = req.body;
    
    const plan = await Plan.create({
      planKey, name,
      priceMonthly: priceMonthly || 0,
      priceQuarterly: priceQuarterly || 0,
      priceYearly: priceYearly || 0,
      features: features || [],
      color: color || '#3b82f6',
      icon: icon || 'bi-briefcase',
      recommended: recommended || false,
      active: active !== false,
      sortOrder: sortOrder || 0,
      description: description || ''
    });

    res.status(201).json(plan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/plans/:id
router.put('/:id', async (req, res) => {
  try {
    const plan = await Plan.findByPk(req.params.id);
    if (!plan) return res.status(404).json({ message: 'Plan not found' });

    const { planKey, name, priceMonthly, priceQuarterly, priceYearly, features, color, icon, recommended, active, sortOrder, description } = req.body;

    // If setting this as recommended, unset all others
    if (recommended === true) {
      await Plan.update({ recommended: false }, { where: {} });
    }

    await plan.update({
      planKey: planKey ?? plan.planKey,
      name: name ?? plan.name,
      priceMonthly: priceMonthly ?? plan.priceMonthly,
      priceQuarterly: priceQuarterly ?? plan.priceQuarterly,
      priceYearly: priceYearly ?? plan.priceYearly,
      features: features ?? plan.features,
      color: color ?? plan.color,
      icon: icon ?? plan.icon,
      recommended: recommended ?? plan.recommended,
      active: active ?? plan.active,
      sortOrder: sortOrder ?? plan.sortOrder,
      description: description ?? plan.description
    });

    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/plans/:id
router.delete('/:id', async (req, res) => {
  try {
    const plan = await Plan.findByPk(req.params.id);
    if (!plan) return res.status(404).json({ message: 'Plan not found' });
    await plan.destroy();
    res.json({ message: 'Plan deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
