import mongoose, { trusted } from "mongoose";

const orderSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    addressId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Address",
      required: true,
    },
    orderAt: {
      type: Date,
      default: Date.now,
    },
    paymentId: {
      type: String,
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    payableAmount: {
      type: Number,
      required: true,
    },
    totalDiscount: {
      type: Number,
    },
    orderStatus: {
      type: String,
      required: true,
      enum: [
        "Pending",
        "Shipped",
        "Delivered",
        "Cancelled",
        "Return Requested",
        "Returned",
      ],
      default: "Pending",
    },
    paymentStatus: {
      type: String,
      required: true,
      enum: ["Pending", "Paid", "Failed"],
      default: "Pending",
    },
    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        variantId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        productPrice: {
          type: Number,
          required: true,
        },
        productDiscountPrice: {
          type: Number,
          default: null,
        },
        itemStatus: {
          type: String,
          required: true,
          enum: [
            "Pending",
            "Shipped",
            "Delivered",
            "Cancelled",
            "Return Requested",
            "Returned",
          ],
          default: "Pending",
        },
        itemPaymentStatus: {
          type: String,
          required: true,
          enum: ["Pending", "Paid", "Failed"],
          default: "Pending",
        },
        itemReturnReason: {
          type: String,
        },
      },
    ],
  },
  { timestamps: true }
);

export const Order = mongoose.model("Order", orderSchema);
