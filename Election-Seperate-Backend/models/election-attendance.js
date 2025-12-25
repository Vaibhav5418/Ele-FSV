const mongoose = require('mongoose');

const attendSchema = new mongoose.Schema({
    name: {
        type: String,
    },
    mobile: {
        type: Number,
        maxlength: 10,
    },
    present: {
        type: Number,
        default: 1
    },
    presentDate: {
        type: String
    },
    latitude: {
        type: String
    },
    longitude: {
        type: String
    },
    presentTime: {
        type: String
    },
});

const Attend = mongoose.model('election-attendance', attendSchema);

module.exports = Attend;
