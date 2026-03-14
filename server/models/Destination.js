const mongoose = require('mongoose');

const TranslationSchema = new mongoose.Schema({
    name: { type: String },
    description: { type: String }
}, { _id: false });

const DestinationSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    imagePath: { type: String, required: true },
    description: { type: String, required: true },
    translations: {
        ru: { type: TranslationSchema, default: {} },
        ar: { type: TranslationSchema, default: {} }
    }
}, { timestamps: true });

module.exports = mongoose.model('Destination', DestinationSchema);
