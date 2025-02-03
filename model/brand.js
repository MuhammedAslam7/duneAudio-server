import mongoose from "mongoose";

const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },

    listed: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const Brand = mongoose.model("Brand", brandSchema);
