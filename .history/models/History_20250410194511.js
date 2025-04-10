// models/History.js
const mongoose = require('mongoose');

const HistorySchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  loginAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('History', HistorySchema);
