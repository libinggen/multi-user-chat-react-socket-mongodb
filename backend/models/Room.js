// models/Room.js
const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  name: { type: String, unique: true, required: true },
  users: [String]
});

module.exports = mongoose.model('Room', RoomSchema);
