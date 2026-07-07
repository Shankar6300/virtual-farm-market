const MessageModel = require("../../../db/models/Message");
const NotificationModel = require("../../../db/models/Notification");
const { check, validationResult } = require("express-validator");

module.exports = {
  sendMessage: async (req, res) => {
    try {
      const validationRules = [
        check("order").notEmpty().withMessage("order must be provided"),
        check("receiver").notEmpty().withMessage("receiver must be provided"),
        check("text").notEmpty().withMessage("text must be provided"),
      ];
      await Promise.all(validationRules.map((rule) => rule.run(req)));
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ message: errors.array()[0].msg });
      }

      const { order, receiver, text } = req.body;
      const sender = req.userInfo._id;
      const senderName = req.userInfo.name || "User";

      const message = await MessageModel.create({
        order,
        sender,
        receiver,
        senderName,
        text,
      });

      // Send alert notification to the receiver
      await NotificationModel.create({
        userId: receiver,
        title: "New Chat Message",
        content: `${senderName}: ${text.substring(0, 40)}${text.length > 40 ? "..." : ""}`,
      });

      return res.status(200).json({
        status: "success",
        message: "Message sent.",
        data: message,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        status: "error",
        message: "Internal Server Error",
      });
    }
  },

  getMessages: async (req, res) => {
    try {
      const validationRules = [
        check("order").notEmpty().withMessage("order must be provided"),
      ];
      await Promise.all(validationRules.map((rule) => rule.run(req)));
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ message: errors.array()[0].msg });
      }

      const messages = await MessageModel.find({ order: req.body.order }).sort({ createdAt: 1 });

      return res.status(200).json({
        status: "success",
        message: "Messages fetched.",
        data: messages,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        status: "error",
        message: "Internal Server Error",
      });
    }
  },
};
