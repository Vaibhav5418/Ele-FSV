const mongoose = require('mongoose');

const cameraSchema = new mongoose.Schema({
    deviceId: { type: String, required: true },
    name: { type: String },
    districtAssemblyCode: { type: String },
    locations: [{ type: String }],
    location_Type: { type: String },
    operatorId: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    geoPoint: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number]
        }
    }
}, { timestamps: true });

cameraSchema.index({ geoPoint: '2dsphere' });

module.exports = mongoose.model('Camera', cameraSchema, 'camera');
