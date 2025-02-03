import mongoose from "mongoose";

const otpSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  verified: {
    type: Boolean,
    default: false,
  },
});

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 120 });

const Otp = mongoose.model("Otp", otpSchema);

export default Otp;
