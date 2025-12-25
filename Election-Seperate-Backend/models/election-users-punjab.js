const mongoose = require('mongoose');

const userSchemaPunjab = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    mobile: {
        type: Number,
        maxlength: 10,
        required: true,
        unique: true
    },
    role: {
        type: String,
        default: "installer",
    },
    state: {
        type: String,
    },
    stateAssigned: {
        type: String,
    },
    isVerified: {
        type: Number,
        default: 0
    },
    latitude: {
        type: Number,
    },
    longitude: {
        type: Number
    },
    date: {
        type: String,
    },
    time: {
        type: String
    },
    district: {
        type: String
    },
    assemblyName: {
        type: String
    },
    formatted_address: {
        type: String
    },
    formatted_address1: {
        type: String
    },
    formatted_address2: {
        type: String
    }
});

const electionUserPunjab = mongoose.model('election-users-punjab', userSchemaPunjab);

module.exports = electionUserPunjab;
