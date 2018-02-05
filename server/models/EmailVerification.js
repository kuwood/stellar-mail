const mongoose = require("mongoose");

const TWELVE_HOURS_IN_SECONDS = 43200;

const EmailVerification = new mongoose.Schema({
  _userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User"
  },
  token: { type: String, required: true },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
    expires: TWELVE_HOURS_IN_SECONDS
  }
});

mongoose.model("EmailVerification", EmailVerification);
