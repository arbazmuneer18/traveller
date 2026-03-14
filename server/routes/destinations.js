const express = require('express');
const router = express.Router();
const Destination = require('../models/Destination');
const verifyToken = require('../middleware/authMiddleware');

// Get all destinations
router.get('/', async (req, res) => {
    try {
        const destinations = await Destination.find();
        res.json(destinations);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get single destination
router.get('/:id', async (req, res) => {
    try {
        const destination = await Destination.findOne({ id: req.params.id });
        if (!destination) return res.status(404).json({ message: 'Destination not found' });
        res.json(destination);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create/Update destination
router.post('/', verifyToken, async (req, res) => {
    try {
        const { id, name, imagePath, description } = req.body;
        let destination = await Destination.findOne({ id });
        
        if (destination) {
            // Update
            destination.name = name;
            destination.imagePath = imagePath;
            destination.description = description;
            await destination.save();
        } else {
            // Create
            destination = new Destination({ id, name, imagePath, description });
            await destination.save();
        }
        res.status(201).json(destination);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete destination
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const destination = await Destination.findOneAndDelete({ id: req.params.id });
        if (!destination) return res.status(404).json({ message: 'Destination not found' });
        res.json({ message: 'Destination deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Save auto-translated text for a destination
// PATCH /api/destinations/:id/translations
// Body: { lang: 'ru', name: '...', description: '...' }
router.patch('/:id/translations', verifyToken, async (req, res) => {
    try {
        const { lang, name, description } = req.body;
        if (!lang || !['ru', 'ar'].includes(lang)) {
            return res.status(400).json({ message: 'lang must be ru or ar' });
        }
        const update = {};
        if (name)        update[`translations.${lang}.name`]        = name;
        if (description) update[`translations.${lang}.description`] = description;

        const destination = await Destination.findOneAndUpdate(
            { id: req.params.id },
            { $set: update },
            { new: true }
        );
        if (!destination) return res.status(404).json({ message: 'Destination not found' });
        res.json(destination);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
