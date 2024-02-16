const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  user: {
    type: String,
    required: true
  },
  chatUser: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
  // You can add more fields as needed, like whether the message has been read, attachments, etc.
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
