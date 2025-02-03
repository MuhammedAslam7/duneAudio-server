import mongoose from "mongoose";

const cartSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: {
      type: [
        {
          productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
          },
          variantId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
          },
          quantity: {
            type: Number,
            default: 1,
            required: true,
          },
          color: {
            type: String,
            required: true
          },
        },
      ],
      default: [],
    },
    totalPrice: {
      type: Number,
      default: 0,
    },
    totalDiscount: {
      type: Number,
      default: 0
    },
  },
  { timestamps: true }
);

export const Cart = mongoose.model("Cart", cartSchema);
