const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
    // Top Section Fields
    districtName: { type: String, required: true },
    acName: { type: String, required: true },
    vehicleNo: { type: String, required: true },
    installationDate: { type: Date, required: true },
    installationSiteAddress: { type: String, required: true },
    driverName: { type: String, required: true },
    driverMobileNo: { type: String, required: true },
    fstName: { type: String, required: false, default: '' },
    fstMobileNo: { type: String, required: false, default: '' },
    typeOfVehicle: { type: String, required: true },
    isQrtVehicle: { type: String, enum: ['Yes', 'No'], default: 'No' },

    // Equipment & Installation Fields
    ptzCameraModelNumber: { type: String },
    ptzCameraSerialNumber: { type: String },
    ptzCameraInstalledOnVehicle: { type: String, enum: ['Yes', 'No'] },
    nvrModelNo: { type: String },
    nvrInstalled: { type: String, enum: ['Yes', 'No'] },
    batterySerialNo: { type: String },
    batteryInstalledAtVehicle: { type: String, enum: ['Yes', 'No'] },
    backsideLCDInstalled: { type: String, enum: ['Yes', 'No'] },
    gpsDeviceSerialNo: { type: String },
    gpsDeviceInstalled: { type: String, enum: ['Yes', 'No'] },
    dcAcConverterInstalled: { type: String, enum: ['Yes', 'No'] },
    internet4GRouterInstalledBackSite: { type: String, enum: ['Yes', 'No'] },
    internet4GRouterSimNo: { type: String },
    electricalPowerStripInstalled: { type: String, enum: ['Yes', 'No'] },
    trainingToDriverAndFSTMember: { type: String, enum: ['Yes', 'No'] },
    successfulTestWebStreaming: { type: String, enum: ['Yes', 'No'] },

    // Photos (Blob URLs)
    vehiclePhotoUrl: { type: String },
    driverPhotoUrl: { type: String },
    fstMemberPhotoUrl: { type: String },
    serviceProviderPhotoUrl: { type: String },
    pilPhotoUrl: { type: String },
    localScreenPhotoUrl: { type: String },
    streamScreenshotUrl: { type: String },
    createdByMobile: { type: String, index: true }

}, { timestamps: true });

vehicleSchema.index({ createdAt: -1 });
vehicleSchema.index({ districtName: 1 });
vehicleSchema.index({ acName: 1 });
vehicleSchema.index({ ptzCameraSerialNumber: 1 });
vehicleSchema.index({ vehicleNo: 1 });

module.exports = mongoose.model('Vehicle', vehicleSchema);
