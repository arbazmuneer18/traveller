const express = require('express');
const router = express.Router();
const Property = require('../models/Property');
const verifyToken = require('../middleware/authMiddleware');
const cache = require('../cache');

// Get all properties
router.get('/', async (req, res) => {
    const cacheKey = 'properties:all';
    const cached = cache.get(cacheKey);
    if (cached) {
        res.set('Cache-Control', 'public, max-age=30');
        return res.json(cached);
    }
    try {
        const properties = await Property.find();
        cache.set(cacheKey, properties);
        res.set('Cache-Control', 'public, max-age=30');
        res.json(properties);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get properties by destination
router.get('/destination/:destId', async (req, res) => {
    const cacheKey = `properties:dest:${req.params.destId}`;
    const cached = cache.get(cacheKey);
    if (cached) {
        res.set('Cache-Control', 'public, max-age=30');
        return res.json(cached);
    }
    try {
        const properties = await Property.find({ destinationId: req.params.destId });
        cache.set(cacheKey, properties);
        res.set('Cache-Control', 'public, max-age=30');
        res.json(properties);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get single property
router.get('/:id', async (req, res) => {
    const cacheKey = `properties:${req.params.id}`;
    const cached = cache.get(cacheKey);
    if (cached) {
        res.set('Cache-Control', 'public, max-age=30');
        return res.json(cached);
    }
    try {
        const property = await Property.findOne({ id: req.params.id });
        if (!property) return res.status(404).json({ message: 'Property not found' });
        cache.set(cacheKey, property);
        res.set('Cache-Control', 'public, max-age=30');
        res.json(property);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create/Update property
router.post('/', verifyToken, async (req, res) => {
    try {
        const propData = req.body;
        let property = await Property.findOne({ id: propData.id });
        
        if (property) {
            // Update
            Object.assign(property, propData);
            await property.save();
        } else {
            // Create
            property = new Property(propData);
            await property.save();
        }
        res.status(201).json(property);
        cache.invalidate('properties:'); // Invalidate stale cache
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete property
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const property = await Property.findOneAndDelete({ id: req.params.id });
        if (!property) return res.status(404).json({ message: 'Property not found' });
        res.json({ message: 'Property deleted' });
        cache.invalidate('properties:'); // Invalidate stale cache
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
