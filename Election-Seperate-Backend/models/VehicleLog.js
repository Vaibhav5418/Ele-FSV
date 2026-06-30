const mongoose = require('mongoose');

const vehicleLogSchema = new mongoose.Schema({
    vehicleNo: { type: String, required: true },
    history: [{ type: mongoose.Schema.Types.Mixed }]
});

// Use 'vehiclelogs_v2' collection explicitly
const VehicleLog = mongoose.model('VehicleLog', vehicleLogSchema, 'vehiclelogs_v2');

module.exports = VehicleLog;
