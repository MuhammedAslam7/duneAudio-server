import express from "express";
import { addCoupon, allCoupons, couponById, deleteCoupon, updateCoupon, updateCouponStatus } from "../controllers/couponController.js";

const router = express.Router();

router.post("/add-coupon", addCoupon);
router.get("/all-coupons", allCoupons)
router.get("/coupon", couponById)
router.patch("/update-status", updateCouponStatus)
router.patch("/update-coupon", updateCoupon)
router.delete("/delete-coupon", deleteCoupon)

export default router;
