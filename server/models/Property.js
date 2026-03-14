const mongoose = require('mongoose');

const PackageSchema = new mongoose.Schema({
    name: String,
    multiplier: Number,
    desc: String,
    features: [String]
}, { _id: false });

const PropertySchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    destinationId: { type: String, required: true },
    title: { type: String, required: true },
    propertyType: { type: String, required: true },
    basePrice: { type: Number, required: true },
    rating: { type: Number, required: true },
    aboutText: { type: String, required: true },
    images: [String],
    amenities: [String],
    packages: {
        affordable: PackageSchema,
        value: PackageSchema,
        luxury: PackageSchema
    }
}, { timestamps: true });

module.exports = mongoose.model('Property', PropertySchema);
