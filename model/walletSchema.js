import mongoose from "mongoose";

const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, 
    },
    balance: {
      type: Number,
      required: true,
      default: 0,
    },
    transactions: [
      {
        transactionId: {
          type: String,
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
        description: {
          type: String,
          default: "",
        },
        date: {
          type: Date,
          default: Date.now, 
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true, 
    },
  },
  { timestamps: true }
);

export const Wallet = mongoose.model("Wallet", walletSchema);
