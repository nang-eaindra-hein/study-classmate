const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username:       { type: String, unique: true, required: true, index: true },
  password:       { type: String, required: true },
  diamonds:       { type: Number, default: 20 },
  streakDays:     { type: Number, default: 0 },
  bio:            { type: String, default: '' },
  avatarUrl:      { type: String, default: '' },
  scores:         [{ name: String, score: Number, time: String }],
  purchasedSkins: { type: [String], default: [] },
  selectedSkinId: { type: Number, default: null }
});

module.exports = mongoose.model('User', userSchema);
