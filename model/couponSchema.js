import mongoose from "mongoose";

const couponSchema = mongoose.Schema(
  {
    couponCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    discountAmount: {
      type: Number,
      required: true,
    },
    minPurchaseAmount: {  
      type: Number,
      required: true,
    },
    expirationDate: {
      type: Date,
    },
    listed: {
      type: Boolean,
      default: true,
    },
    usedUsersId: [
      {
        type: mongoose.Types.ObjectId,
        ref: "User"
      }
    ]
  },
  { timestamps: true }
);

export const Coupon = mongoose.model("Coupon", couponSchema);
