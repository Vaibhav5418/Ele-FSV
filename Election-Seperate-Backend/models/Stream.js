const mongoose = require('mongoose');

const streamSchema = new mongoose.Schema({
    deviceId: { type: String },
    "server name": { type: String },
    mediaUrl: { type: String },
    p2purl: { type: String },
    plan: { type: String },
    streamTokens: [{ type: String }],
    quality: { type: String },
    smartQuality: { type: Boolean },
    dataPlan: { type: Number },
    status: { type: Boolean },
    is_live: { type: Boolean },
    priority: { type: Number }
}, { collection: 'stream' }); // Explicitly pointing to 'stream' collection

module.exports = mongoose.model('Stream', streamSchema);
