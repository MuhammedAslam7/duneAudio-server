import express from "express";
import {
  addAddress,
  addToCart,
  allProductsForSearch,
  cartItems,
  changePassword,
  checkoutPage,
  deleteAddress,
  deleteCartItem,
  getAddress,
  getBrandCategory,
  paymentPage,
  productPage,
  productsForSearch,
  profileDetails,
  updateAddress,
  updateCartQuantity,
  updateProfile,
  userHome,
  verifyStock,
} from "../controllers/userController.js";
import { verifyRole, verifyToken } from "../middewares/jwt-verify.js";
import { getProductById } from "../controllers/productController.js";
import { cancelItem, cancelOrder, myOrders, orderDetails, placeOrder, razorPayPayment, retryOrder, retryRazorpayPayment, returnItem } from "../controllers/orderControllers.js";
import { addToWishlist, removeWishlistItem, wishlist } from "../controllers/wishlistController.js";
import { addMoneyToWallet, getWallet, verifyPayment } from "../controllers/walletController.js";
const router = express.Router();

router.get("/home", verifyToken, userHome);
router.get("/product-details/:id", verifyToken, getProductById);
router.get("/product-page", verifyToken, productPage);
router.get("/all-products-for-search", verifyToken, allProductsForSearch);
router.post("/add-to-cart", verifyToken, addToCart);
router.get("/cart", verifyToken, cartItems);
router.put("/update-quantity", verifyToken, updateCartQuantity);
router.delete("/delete-cartitem", verifyToken, deleteCartItem);
router.get("/category-brand", verifyToken, getBrandCategory);
router.get("/items-for-search", verifyToken, productsForSearch);
router.get("/verify-stock",verifyToken,  verifyStock)
router.get("/checkout-page", verifyToken, checkoutPage)
router.get("/payment-page", verifyToken, paymentPage);

router.post("/add-address", verifyToken, addAddress);
router.get("/address", verifyToken, getAddress);
router.patch("/update-address", verifyToken, updateAddress);
router.delete("/delete-address", verifyToken, deleteAddress);
router.post("/change-password", verifyToken, changePassword);
router.get("/profile-details", verifyToken, profileDetails);
router.patch("/update-profile", verifyToken, updateProfile);

router.post("/place-order", verifyToken, placeOrder)
router.get("/my-orders", verifyToken, myOrders)
router.get("/order-details/:id", verifyToken, orderDetails)
router.patch("/cancel-order", verifyToken, cancelOrder)
router.patch("/cancel-item", verifyToken, cancelItem)
router.patch("/return-item", verifyToken, returnItem)
router.post("/razorpay-payment", verifyToken, razorPayPayment )
router.post("/retry-order", verifyToken, retryOrder)
router.patch("/retry-razorpay-payment", verifyToken, retryRazorpayPayment)


router.post("/add-to-wishlist", verifyToken, addToWishlist)
router.get("/wishlist", verifyToken, wishlist)
router.delete("/wishlist-remove-item", verifyToken, removeWishlistItem)


router.get("/wallet", verifyToken, getWallet)
router.post("/wallet/add-money", verifyToken, addMoneyToWallet)
router.post("/wallet/verify-payment", verifyToken, verifyPayment)

export default router;
