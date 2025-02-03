import mongoose from "mongoose";

const tempUserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    requried: true,
  },
  password: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  otpExpires: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300,
  },
});

tempUserSchema.index({ createdAt: 1 }, { expireAfterSeconds: 300 });

const TempUser = mongoose.model("TempUser", tempUserSchema);
export default TempUser;
