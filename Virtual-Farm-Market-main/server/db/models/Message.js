const mongoose = require("mongoose");
const DS = require("../../services/date");

const MessageSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: "order", required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
  senderName: { type: String, required: true },
  text: { type: String, required: true },
  createdAt: { type: String, default: "" },
});

MessageSchema.pre("save", function (next) {
  if (!this.createdAt) {
    this.createdAt = DS.now();
  }
  next();
});

const MessageModel = mongoose.model("message", MessageSchema);

module.exports = MessageModel;
