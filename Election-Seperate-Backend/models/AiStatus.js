const mongoose = require('mongoose');

const aiStatusSchema = new mongoose.Schema({
  camera_id: {
    type: String,
    required: true,
  },
  blur: {
    type: Boolean,
    default: false,
  },
  blackview: {
    type: Boolean,
    default: false,
  },
  brightness: {
    type: Boolean,
    default: false,
  },
  camera_angle: {
    type: Number,
    default: 0,
  },
  BlackAndWhite: {
    type: Boolean,
    default: false,
  },
  overall_status: {
    type: String,
    default: "OK",
  },
  bit_rate_bps: {
    type: Number,
    default: 0,
  },
  video_format: {
    type: String,
    default: "h264",
  },
  audio_format: {
    type: String,
    default: "aac",
  },
  fps: {
    type: Number,
    default: 0,
  },
  stream_details_status: {
    type: String,
    default: "success",
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('AiStatus', aiStatusSchema, 'aistatus');
