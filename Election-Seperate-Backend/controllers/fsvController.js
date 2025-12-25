const Driver = require('../models/Driver');
const FstMember = require('../models/FstMember');
const Vehicle = require('../models/Vehicle');
const FsvData = require('../models/FsvData');
const EleFlv = require('../models/election-flv-data'); // Assuming this path exists based on grep
const AuditLog = require('../models/AuditLog');
const { logAction } = require('../utils/auditLogger');
const electionUser = require('../models/election-user');
const { BlobServiceClient } = require('@azure/storage-blob');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');

// Polyfill for global.crypto if not present (needed for some Azure/UUID operations in older Node)
if (!global.crypto) {
    global.crypto = crypto;
}

// Azure Connection String (Should ideally be in process.env)
const AZURE_STORAGE_CONNECTION_STRING = "BlobEndpoint=https://nvrdatashinobi.blob.core.windows.net/;QueueEndpoint=https://nvrdatashinobi.queue.core.windows.net/;FileEndpoint=https://nvrdatashinobi.file.core.windows.net/;TableEndpoint=https://nvrdatashinobi.table.core.windows.net/;SharedAccessSignature=sv=2024-11-04&ss=bfqt&srt=sco&sp=rwdlacupiytfx&se=2025-12-30T21:10:43Z&st=2025-10-09T12:55:43Z&spr=https,http&sig=AZlK%2F0VWAm1FnPgSR%2BvHal%2BHcmqknAOE%2FDk4jhvHhAw%3D";
const CONTAINER_NAME = "fsv-photos"; // Ensure this container exists or create it

const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

// Ensure container exists
const ensureContainerExists = async () => {
    try {
        await containerClient.createIfNotExists({ access: 'blob' });
    } catch (error) {
        console.error("Error creating container:", error.message);
    }
};
ensureContainerExists();

exports.searchFsvDevice = async (req, res) => {
    try {
        const { deviceId } = req.params;
        console.log(`Searching for FSV Device: ${deviceId}`);

        // 1. Search in FsvData collection
        const fsvData = await FsvData.findOne({ ptzCameraSerialNumber: deviceId });
        
        // 2. Search for Stream URL in EleFlv collection
        // Try searching by streamname OR Filename (based on user feedback)
        const flvData = await EleFlv.findOne({ 
            $or: [
                { streamname: deviceId },
                { Filename: deviceId }
            ]
        }).sort({ _id: -1 });

        if (!fsvData && !flvData) {
            return res.status(404).json({ success: false, message: "Device not found in FSV Data or Stream records" });
        }

        res.status(200).json({
            success: true,
            fsvData: fsvData || null,
            streamUrl: flvData || null
        });

    } catch (error) {
        console.error("Error searching FSV Device:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};


exports.createFsvReport = async (req, res) => {
    try {
        console.log("Received FSV Create Request Body:", JSON.stringify(req.body, null, 2));
        const data = req.body;

        // 1. Create Driver
        console.log("Creating Driver...");
        const driver = await Driver.create({
            driverName: data.driverName,
            driverMobileNo: data.driverMobileNo
        });
        console.log("Driver Created:", driver._id);

        // 2. Create FST Member
        console.log("Creating FST Member...");
        const fstMember = await FstMember.create({
            fstName: data.fstName,
            fstMobileNo: data.fstMobileNo
        });
        console.log("FST Member Created:", fstMember._id);

        // 3. Create Vehicle Report
        console.log("Creating Vehicle Report...");
        const vehicle = await Vehicle.create({
            ...data,
            // Ensure dates are parsed if needed, though Mongoose handles ISO strings well
        });
        console.log("Vehicle Report Created:", vehicle._id);

        // Audit Log
        const userMobile = data.installerMobile || req.body.mobile || 'Unknown';
        if (userMobile && userMobile !== 'Unknown' && !isNaN(parseInt(userMobile))) {
            const user = await electionUser.findOne({ mobile: parseInt(userMobile) });
            if (user) {
                await logAction(user, 'CREATE', 'Vehicle', vehicle._id.toString(), { vehicleNo: data.vehicleNo, districtName: data.districtName }, req.ip);
            }
        }

        res.status(201).json({
            success: true,
            message: "FSV Report Created Successfully",
            data: {
                vehicleId: vehicle._id,
                driverId: driver._id,
                fstMemberId: fstMember._id
            }
        });

    } catch (error) {
        console.error("Error creating FSV Report:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
            stack: error.stack
        });
    }
};

exports.uploadFsvPhotos = async (req, res) => {
    try {
        const { id } = req.params; // Vehicle ID
        const files = req.files; // Multer files

        if (!files || Object.keys(files).length === 0) {
            return res.status(400).json({ success: false, message: "No files uploaded" });
        }

        const vehicle = await Vehicle.findById(id);
        if (!vehicle) {
            return res.status(404).json({ success: false, message: "Vehicle Report not found" });
        }

        const updates = {};

        // Upload each file to Azure
        for (const [fieldName, fileArray] of Object.entries(files)) {
            const file = fileArray[0]; // Assuming single file per field
            const blobName = `${id}/${fieldName}-${uuidv4()}${path.extname(file.originalname)}`;
            const blockBlobClient = containerClient.getBlockBlobClient(blobName);

            await blockBlobClient.uploadData(file.buffer, {
                blobHTTPHeaders: { blobContentType: file.mimetype }
            });

            // Update the corresponding URL field in the database
            // Mapping field names from frontend to DB schema
            if (fieldName === 'vehiclePhoto') updates.vehiclePhotoUrl = blockBlobClient.url;
            if (fieldName === 'driverPhoto') updates.driverPhotoUrl = blockBlobClient.url;
            if (fieldName === 'fstMemberPhoto') updates.fstMemberPhotoUrl = blockBlobClient.url;
            if (fieldName === 'serviceProviderPhoto') updates.serviceProviderPhotoUrl = blockBlobClient.url;
            if (fieldName === 'pilPhoto') updates.pilPhotoUrl = blockBlobClient.url;
        }

        // Save updates to DB
        const updatedVehicle = await Vehicle.findByIdAndUpdate(id, updates, { new: true });

        // Audit Log
        const userMobile = req.body.mobile || 'Unknown';
        if (userMobile && userMobile !== 'Unknown' && !isNaN(parseInt(userMobile))) {
            const user = await electionUser.findOne({ mobile: parseInt(userMobile) });
            if (user) {
                await logAction(user, 'UPDATE', 'Vehicle', id, { action: 'Photo Upload', fields: Object.keys(updates) }, req.ip);
            }
        }

        res.status(200).json({
            success: true,
            message: "Photos Uploaded Successfully",
            data: updatedVehicle
        });

    } catch (error) {
        console.error("Error uploading photos:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};

exports.getFsvReport = async (req, res) => {
    try {
        const { id } = req.params;
        const vehicle = await Vehicle.findById(id);

        if (!vehicle) {
            return res.status(404).json({ success: false, message: "Report not found" });
        }

        res.status(200).json({
            success: true,
            data: vehicle
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const https = require('https');

exports.proxyStream = async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) {
            return res.status(400).send("Missing URL parameter");
        }

        console.log(`Proxying stream: ${url}`);

        const response = await axios({
            method: 'get',
            url: url,
            responseType: 'stream',
            validateStatus: () => true, // Don't throw on 404/500
            httpsAgent: new https.Agent({  
                rejectUnauthorized: false // Ignore SSL errors
            })
        });

        console.log(`Upstream Status: ${response.status}`);
        console.log(`Upstream Content-Type: ${response.headers['content-type']}`);

        if (response.status !== 200) {
            return res.status(response.status).send(`Upstream error: ${response.status}`);
        }

        // Forward headers
        res.set('Content-Type', response.headers['content-type']);
        if (response.headers['content-length']) {
            res.set('Content-Length', response.headers['content-length']);
        }
        
        // Pipe the stream
        response.data.pipe(res);

    } catch (error) {
        console.error("Proxy Error:", error.message);
        res.status(500).send("Error fetching stream");
    }
};

exports.getSuggestions = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query || query.length < 3) {
            return res.status(200).json({ success: true, suggestions: [] });
        }

        const regex = new RegExp(query, 'i'); // Case-insensitive regex

        // 1. Search FsvData
        const fsvResults = await FsvData.find({ ptzCameraSerialNumber: regex })
            .select('ptzCameraSerialNumber')
            .limit(10);

        // 2. Search EleFlv
        const eleResults = await EleFlv.find({
            $or: [
                { streamname: regex },
                { Filename: regex }
            ]
        })
        .select('streamname Filename')
        .limit(10);

        // Combine and deduplicate
        const suggestions = new Set();
        fsvResults.forEach(item => suggestions.add(item.ptzCameraSerialNumber));
        eleResults.forEach(item => {
            if (item.streamname) suggestions.add(item.streamname);
            if (item.Filename) suggestions.add(item.Filename);
        });

        res.status(200).json({
            success: true,
            suggestions: Array.from(suggestions).sort()
        });

    } catch (error) {
        console.error("Error fetching suggestions:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};


exports.getAllFsvReports = async (req, res) => {
    try {
        const reports = await Vehicle.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: reports.length,
            data: reports
        });
    } catch (error) {
        console.error("Error fetching all reports:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateFsvReport = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const oldVehicle = await Vehicle.findById(id);
        const vehicle = await Vehicle.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true
        });

        if (!vehicle) {
            return res.status(404).json({ success: false, message: "Report not found" });
        }

        // Audit Log - track changes
        const userMobile = req.body.mobile || req.query.mobile || 'Unknown';
        if (userMobile && userMobile !== 'Unknown' && !isNaN(parseInt(userMobile))) {
            const user = await electionUser.findOne({ mobile: parseInt(userMobile) });
            if (user) {
                const changes = { before: {}, after: {} };
                Object.keys(updates).forEach(key => {
                    if (oldVehicle[key] !== updates[key]) {
                        changes.before[key] = oldVehicle[key];
                        changes.after[key] = updates[key];
                    }
                });
                await logAction(user, 'UPDATE', 'Vehicle', id, changes, req.ip);
            }
        }

        res.status(200).json({
            success: true,
            data: vehicle
        });
    } catch (error) {
        console.error("Error updating report:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAuditLogs = async (req, res) => {
    try {
        const { page = 1, limit = 50, action, resourceType, userMobile, startDate, endDate } = req.query;
        
        const query = {};
        if (action) query.action = action;
        if (resourceType) query.resourceType = resourceType;
        if (userMobile) query.userMobile = userMobile;
        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) query.timestamp.$gte = new Date(startDate);
            if (endDate) query.timestamp.$lte = new Date(endDate);
        }

        const logs = await AuditLog.find(query)
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const total = await AuditLog.countDocuments(query);

        res.status(200).json({
            success: true,
            count: logs.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            data: logs
        });
    } catch (error) {
        console.error("Error fetching audit logs:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

