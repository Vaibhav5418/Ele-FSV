const Driver = require('../models/Driver');
const FstMember = require('../models/FstMember');
const Vehicle = require('../models/Vehicle');
const FsvData = require('../models/FsvData');
const EleFlv = require('../models/election-flv-data');
const EleCamera = require('../models/election-camera');
const AuditLog = require('../models/AuditLog');
const { logAction } = require('../utils/auditLogger');
const electionUser = require('../models/election-user');
const { BlobServiceClient } = require('@azure/storage-blob');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const axios = require('axios');
const AiStatus = require('../models/AiStatus');

// Polyfill for global.crypto if not present (needed for some Azure/UUID operations in older Node)
if (!global.crypto) {
    global.crypto = crypto;
}

// Azure Connection String (Should ideally be in process.env)
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
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

const JESSIBUCA_SCRIPT_SOURCES = [
    process.env.JESSICA_SCRIPT_URL,
    'https://cdn.jsdelivr.net/npm/jessibuca@3.3.0/dist/jessibuca.js',
    'https://cdn.jsdelivr.net/npm/jessibuca/dist/jessibuca.js',
    'https://unpkg.com/jessibuca/dist/jessibuca.js'
].filter(Boolean);

let jessibucaScriptCache = null;
let jessibucaScriptFetchedAt = 0;
const JESSIBUCA_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const looksLikeValidJs = (content = '') => {
    const trimmed = String(content).trim();
    if (!trimmed) return false;
    if (trimmed.startsWith('<')) return false; // HTML fallback / blocked page
    const lower = trimmed.toLowerCase();
    if (lower.includes('access denied') || lower.includes('forbidden') || lower.includes('illegal')) return false;
    return (
        trimmed.includes('Jessibuca') ||
        trimmed.includes('window.Jessibuca') ||
        trimmed.includes('function')
    );
};

exports.getJessibucaScript = async (req, res) => {
    try {
        // First priority: serve locally bundled script if present (works without internet/CDN).
        const localScriptPath = process.env.JESSICA_LOCAL_SCRIPT_PATH
            || path.resolve(__dirname, '../public/jessibuca.js');
        if (fs.existsSync(localScriptPath)) {
            const localScript = fs.readFileSync(localScriptPath, 'utf8');
            if (looksLikeValidJs(localScript)) {
                res.set('Content-Type', 'application/javascript; charset=utf-8');
                res.set('Cache-Control', 'public, max-age=3600');
                return res.status(200).send(localScript);
            }
            console.error('Local Jessibuca script exists but content is invalid JS at:', localScriptPath);
        }

        const now = Date.now();
        if (jessibucaScriptCache && now - jessibucaScriptFetchedAt < JESSIBUCA_CACHE_TTL_MS) {
            res.set('Content-Type', 'application/javascript; charset=utf-8');
            res.set('Cache-Control', 'public, max-age=3600');
            return res.status(200).send(jessibucaScriptCache);
        }

        for (const scriptUrl of JESSIBUCA_SCRIPT_SOURCES) {
            try {
                const response = await axios.get(scriptUrl, {
                    timeout: 12000,
                    responseType: 'text',
                    validateStatus: () => true,
                    httpsAgent: new https.Agent({ rejectUnauthorized: false })
                });

                if (response.status !== 200) {
                    console.error('Jessibuca source returned non-200:', scriptUrl, response.status);
                    continue;
                }

                const scriptBody = typeof response.data === 'string' ? response.data : '';
                if (!looksLikeValidJs(scriptBody)) {
                    console.error('Jessibuca source returned invalid JS payload:', scriptUrl);
                    continue;
                }

                jessibucaScriptCache = scriptBody;
                jessibucaScriptFetchedAt = now;

                res.set('Content-Type', 'application/javascript; charset=utf-8');
                res.set('Cache-Control', 'public, max-age=3600');
                return res.status(200).send(scriptBody);
            } catch (err) {
                console.error('Failed to fetch Jessibuca from source:', scriptUrl, err.message);
            }
        }

        return res.status(502).json({
            success: false,
            message: 'Unable to fetch Jessibuca script from configured sources. Place jessibuca.js at Election-Seperate-Backend/public/jessibuca.js'
        });
    } catch (error) {
        console.error('Error serving Jessibuca script:', error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

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

        // 3. Search for AI Status
        const aiStatus = await AiStatus.findOne({ camera_id: deviceId }).sort({ timestamp: -1, _id: -1 });

        res.status(200).json({
            success: true,
            fsvData: fsvData || null,
            streamUrl: flvData || null,
            aiStatus: aiStatus || null
        });

    } catch (error) {
        console.error("Error searching FSV Device:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.saveAiStatus = async (req, res) => {
    try {
        const payload = req.body || {};
        const cameraId = payload.camera_id || payload.deviceId || payload.cameraId;

        if (!cameraId) {
            return res.status(400).json({ success: false, message: "camera_id or deviceId is required" });
        }

        const updatePayload = {
            blur: Boolean(payload.blur),
            blackview: Boolean(payload.blackview ?? payload.blackView),
            brightness: Boolean(payload.brightness),
            camera_angle: Number(payload.camera_angle ?? payload.cameraAngle ?? 0),
            BlackAndWhite: Boolean(payload.BlackAndWhite ?? payload.blackAndWhite),
            overall_status: payload.overall_status || payload.overallStatus || "OK",
            bit_rate_bps: Number(payload.bit_rate_bps ?? payload.bitRateBps ?? 0),
            video_format: payload.video_format || payload.videoFormat || "h264",
            audio_format: payload.audio_format || payload.audioFormat || "aac",
            fps: Number(payload.fps ?? 0),
            stream_details_status: payload.stream_details_status || payload.streamDetailsStatus || "success",
            timestamp: payload.timestamp || payload.analyzedAt || new Date(),
        };

        const record = await AiStatus.findOneAndUpdate(
            { camera_id: cameraId },
            {
                $set: updatePayload,
                $setOnInsert: { camera_id: cameraId }
            },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        return res.status(200).json({
            success: true,
            message: "AI status upserted",
            data: record
        });
    } catch (error) {
        console.error("Error saving AI status:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.getLatestAiStatus = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const aiStatus = await AiStatus.findOne({ camera_id: deviceId }).sort({ timestamp: -1, _id: -1 });

        if (!aiStatus) {
            return res.status(404).json({ success: false, message: "AI status not found" });
        }

        return res.status(200).json({
            success: true,
            data: aiStatus
        });
    } catch (error) {
        console.error("Error fetching latest AI status:", error);
        return res.status(500).json({ success: false, message: error.message });
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
        let fstMember = null;
        const hasFstData = Boolean((data.fstName || '').trim() || (data.fstMobileNo || '').trim());
        if (hasFstData) {
            console.log("Creating FST Member...");
            fstMember = await FstMember.create({
                fstName: data.fstName || '',
                fstMobileNo: data.fstMobileNo || ''
            });
            console.log("FST Member Created:", fstMember._id);
        }

        // 3. Create Vehicle Report
        console.log("Creating Vehicle Report...");
        const vehicle = await Vehicle.create({
            ...data,
            createdByMobile: data.installerMobile || req.body.mobile || 'Unknown'
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
                fstMemberId: fstMember ? fstMember._id : null
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
            if (fieldName === 'localScreenPhoto') updates.localScreenPhotoUrl = blockBlobClient.url;
            if (fieldName === 'streamScreenshot') updates.streamScreenshotUrl = blockBlobClient.url;
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
        // Prevent browser/proxy caching for live stream and keep connection open
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
        res.set('Surrogate-Control', 'no-store');
        res.set('Connection', 'keep-alive');
        res.set('X-Accel-Buffering', 'no');

        // Pipe the stream
        response.data.on('error', (streamErr) => {
            console.error("Upstream stream error:", streamErr.message);
            if (!res.headersSent) {
                res.status(502).send("Upstream stream error");
            } else {
                res.end();
            }
        });
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
        const { startDate, endDate } = req.query;

        let query = {};
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                query.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999); // End of day
                query.createdAt.$lte = end;
            }
        }

        const reports = await Vehicle.find(query).sort({ createdAt: -1 }).lean();

        // 1. Extract unique installer mobiles
        const userMobiles = [...new Set(reports.map(r => r.createdByMobile).filter(m => m && m !== 'Unknown'))];

        // 2. Lookup names in the election-users collection
        const numericMobiles = userMobiles.map(m => parseInt(m, 10)).filter(m => !isNaN(m));
        const users = await electionUser.find({ mobile: { $in: numericMobiles } }).lean();

        // Create a mapping of mobile -> name
        const userMap = {};
        users.forEach(u => {
            userMap[u.mobile] = u.name;
        });

        // 3. Inject user data into reports
        const enhancedReports = reports.map(r => {
            let installerName = 'Unknown';
            let installerMobile = r.createdByMobile || 'Unknown';

            if (r.createdByMobile && r.createdByMobile !== 'Unknown') {
                const mobileNum = parseInt(r.createdByMobile, 10);
                if (!isNaN(mobileNum) && userMap[mobileNum]) {
                    installerName = userMap[mobileNum];
                }
            }

            return {
                ...r,
                installerName,
                installerMobile
            };
        });

        res.status(200).json({
            success: true,
            count: enhancedReports.length,
            data: enhancedReports
        });
    } catch (error) {
        console.error("Error fetching all reports:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAllInstallationsWithImageUrls = async (req, res) => {
    try {
        const installations = await Vehicle.find({}).sort({ createdAt: -1 }).lean();

        const data = installations.map((installation) => ({
            ...installation,
            vehiclePhotoUrl: installation.vehiclePhotoUrl || '',
            driverPhotoUrl: installation.driverPhotoUrl || '',
            fstMemberPhotoUrl: installation.fstMemberPhotoUrl || '',
            serviceProviderPhotoUrl: installation.serviceProviderPhotoUrl || '',
            pilPhotoUrl: installation.pilPhotoUrl || '',
            localScreenPhotoUrl: installation.localScreenPhotoUrl || '',
            streamScreenshotUrl: installation.streamScreenshotUrl || ''
        }));

        return res.status(200).json({
            success: true,
            count: data.length,
            data
        });
    } catch (error) {
        console.error("Error fetching all installations with image URLs:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.getUserInstallations = async (req, res) => {
    try {
        const userMobile = req.user ? req.user.mobile : req.query.mobile;

        if (!userMobile) {
            return res.status(400).json({ success: false, message: "Mobile number is required" });
        }

        const installations = await Vehicle.find({ createdByMobile: userMobile }).sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: installations.length,
            data: installations
        });
    } catch (error) {
        console.error("Error fetching user installations:", error);
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

// Users Installation Report specific to FSV data
exports.getUsersInstallationReport = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        let query = {};

        // Date filtering
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                query.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.createdAt.$lte = end;
            }
        }

        const allVehicles = await Vehicle.find(query).lean();

        // Fetch installers (excluding masters/admins to keep the list clean)
        const installers = await electionUser.find({ role: { $nin: ['master', 'admin'] } }).lean();

        // Fetch all assigned cameras to verify complete pending list
        const allCameras = await EleCamera.find({}).lean();

        const reportData = [];

        for (const user of installers) {
            // fsV correlations use createdByMobile to attach vehicles securely
            const userVehicles = allVehicles.filter(v => v.createdByMobile == user.mobile);

            // Vehicles with a main photo are interpreted as technically installed
            const completedVehicles = userVehicles.filter(v => !!v.vehiclePhotoUrl);

            // Vehicles created but missing photos
            const incompleteVehicles = userVehicles.filter(v => !v.vehiclePhotoUrl);

            // Fetch ALL cameras assigned to this user from the EleCamera database to get REAL pending cameras 
            // that haven't even been started (no Vehicle record created yet).
            const assignedCameras = allCameras.filter(c => c.assignedDid == user.mobile || c.personMobile == user.mobile);

            // Filter out cameras that are already in the "Completed" list
            // Assuming ptzCameraSerialNumber or gpsDeviceSerialNo matches deviceId
            const completedCameraIds = completedVehicles.map(v => v.ptzCameraSerialNumber);
            const untouchedCameras = assignedCameras.filter(c => !completedCameraIds.includes(c.deviceId));

            const pendingTotal = incompleteVehicles.length + untouchedCameras.length;

            reportData.push({
                user: {
                    name: user.name,
                    mobile: user.mobile,
                    district: user.district || user.stateAssigned || 'N/A',
                    state: user.state || 'N/A'
                },
                installationsCompleted: completedVehicles.length,
                installationsPending: pendingTotal,
                completedDetails: completedVehicles.map(v => ({
                    vehicleNo: v.vehicleNo || 'N/A',
                    district: v.districtName || 'N/A',
                    acName: v.acName || 'N/A',
                    driverName: v.driverName || 'N/A',
                    driverMobile: v.driverMobileNo || 'N/A',
                    ptzCameraId: v.ptzCameraSerialNumber || 'N/A',
                    gpsNo: v.gpsDeviceSerialNo || 'N/A',
                    routerNo: v.internet4GRouterSimNo || 'N/A',
                    installationDate: v.installationDate ? new Date(v.installationDate).toLocaleDateString() : 'N/A',
                    submissionTime: v.createdAt ? new Date(v.createdAt).toLocaleTimeString() : 'N/A',
                    siteAddress: v.installationSiteAddress || 'N/A',
                    status: 'Completed'
                })),
                pendingDetails: [
                    ...incompleteVehicles.map(v => ({
                        ptzCameraId: v.ptzCameraSerialNumber || 'N/A',
                        district: v.districtName || 'N/A',
                        acName: v.acName || 'N/A',
                        status: 'Pending'
                    })),
                    ...untouchedCameras.map(c => ({
                        ptzCameraId: c.deviceId || 'N/A',
                        district: c.district || 'N/A',
                        acName: c.assemblyName || 'N/A',
                        status: 'Pending'
                    }))
                ]
            });
        }

        res.status(200).json({
            success: true,
            data: reportData
        });

    } catch (error) {
        console.error("Error generating user installation report:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
