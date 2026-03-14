const express = require('express');
const router = express.Router();
const Property = require('../models/Property');
const verifyToken = require('../middleware/authMiddleware');

// Get all properties
router.get('/', async (req, res) => {
    try {
        const properties = await Property.find();
        res.json(properties);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get properties by destination
router.get('/destination/:destId', async (req, res) => {
    try {
        const properties = await Property.find({ destinationId: req.params.destId });
        res.json(properties);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get single property
router.get('/:id', async (req, res) => {
    try {
        const property = await Property.findOne({ id: req.params.id });
        if (!property) return res.status(404).json({ message: 'Property not found' });
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
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
