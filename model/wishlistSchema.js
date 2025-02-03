import mongoose, { mongo } from "mongoose";

const wishlistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  items: [
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
      addedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
},{timestamps: true});

export const Wishlist = mongoose.model("Wishlist", wishlistSchema);
