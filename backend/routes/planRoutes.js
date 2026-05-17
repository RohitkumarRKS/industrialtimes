const express = require('express');
const router = express.Router();
const Plan = require('../models/Plan');

// Default plans to seed if table is empty
const defaultPlans = [
  {
    planKey: 'basic',
    name: 'STARTER',
    priceMonthly: 2500,
    priceQuarterly: 7499,
    priceYearly: 29999,
    features: ['3 Articles per month', 'Basic brand listing', 'Email support'],
    color: '#60a5fa',
    icon: 'bi-briefcase',
    recommended: false,
    active: true,
    sortOrder: 1,
    description: 'Perfect for small businesses getting started with media coverage'
  },
  {
    planKey: 'standard',
    name: 'BUSINESS',
    priceMonthly: 4500,
    priceQuarterly: 13499,
    priceYearly: 53999,
    features: ['5 Articles per month', 'Brand promotion', 'Featured on homepage', 'Dedicated account manager', 'Newsletter placement', 'Social media shoutout'],
    color: '#3b82f6',
    icon: 'bi-building',
    recommended: false,
    active: true,
    sortOrder: 2,
    description: 'Ideal for growing businesses seeking wider media reach'
  },
  {
    planKey: 'premium',
    name: 'ENTERPRISE',
    priceMonthly: 9500,
    priceQuarterly: 28499,
    priceYearly: 113999,
    features: ['7 Articles per month', 'Premium brand promotion', 'Featured on homepage', 'Dedicated account manager', 'Newsletter placement', 'Social media campaign', '2 Banner Ad slots', 'Priority publishing'],
    color: '#8b5cf6',
    icon: 'bi-stars',
    recommended: true,
    active: true,
    sortOrder: 3,
    description: 'For established enterprises needing maximum visibility'
  },
  {
    planKey: 'pro',
    name: 'EXECUTIVE',
    priceMonthly: 20000,
    priceQuarterly: 59999,
    priceYearly: 239999,
    features: ['Unlimited Articles', 'Full brand campaign', 'Homepage takeover', 'Dedicated editorial team', 'Newsletter sponsorship', 'Multi-platform campaign', '4 Banner Ad slots', 'Become authorized Author', '1 Digital E-paper feature', 'Industry event access'],
    color: '#da251d',
    icon: 'bi-trophy',
    recommended: false,
    active: true,
    sortOrder: 4,
    description: 'The ultimate corporate package with unlimited access'
  }
];

// @desc    Get all plans (public)
// @route   GET /api/plans
router.get('/', async (req, res) => {
  try {
    const plans = await Plan.findAll({
      order: [['sortOrder', 'ASC']],
    });

    // If no plans exist, seed defaults
    if (plans.length === 0) {
      for (const plan of defaultPlans) {
        await Plan.create(plan);
      }
      const seeded = await Plan.findAll({ order: [['sortOrder', 'ASC']] });
      return res.json(seeded);
    }

    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get a single plan
// @route   GET /api/plans/:id
router.get('/:id', async (req, res) => {
  try {
    const plan = await Plan.findByPk(req.params.id);
    if (!plan) return res.status(404).json({ message: 'Plan not found' });
    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create a new plan
// @route   POST /api/plans
router.post('/', async (req, res) => {
  try {
    const { planKey, name, priceMonthly, priceQuarterly, priceYearly, features, color, icon, recommended, active, sortOrder, description } = req.body;
    
    const plan = await Plan.create({
      planKey,
      name,
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

// @desc    Update a plan
// @route   PUT /api/plans/:id
router.put('/:id', async (req, res) => {
  try {
    const plan = await Plan.findByPk(req.params.id);
    if (!plan) return res.status(404).json({ message: 'Plan not found' });

    const { planKey, name, priceMonthly, priceQuarterly, priceYearly, features, color, icon, recommended, active, sortOrder, description } = req.body;

    // If setting this as recommended, unset all others
    if (recommended === true) {
      await Plan.update({ recommended: false }, { where: {} });
    }

    plan.planKey = planKey ?? plan.planKey;
    plan.name = name ?? plan.name;
    plan.priceMonthly = priceMonthly ?? plan.priceMonthly;
    plan.priceQuarterly = priceQuarterly ?? plan.priceQuarterly;
    plan.priceYearly = priceYearly ?? plan.priceYearly;
    plan.features = features ?? plan.features;
    plan.color = color ?? plan.color;
    plan.icon = icon ?? plan.icon;
    plan.recommended = recommended ?? plan.recommended;
    plan.active = active ?? plan.active;
    plan.sortOrder = sortOrder ?? plan.sortOrder;
    plan.description = description ?? plan.description;

    await plan.save();
    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete a plan
// @route   DELETE /api/plans/:id
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
