const mongoose = require('mongoose');

const punjabElection = new mongoose.Schema({
    deviceId: {
        type: String,
    },
    assemblyName: {
        type: String,
    },
    district: {
        type: String,
    },
    state: {
        type: String,
    }  
});

const punjabDid = mongoose.model('election-punjab', punjabElection);

module.exports = punjabDid;