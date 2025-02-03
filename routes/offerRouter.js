import express from "express";
import { addOffer, deleteOffer, getOfferById, getOffers, getProductAndCategories, updateOffer, updateOfferStatus } from "../controllers/offerController.js";

const router = express.Router();


router.get("/all-offers", getOffers )
router.get("/offer", getOfferById )
router.get('/categoryProducts',getProductAndCategories)
router.post("/add-offer", addOffer)
router.patch("/update-offer", updateOffer)
router.patch("/update-status", updateOfferStatus)
router.delete("/delete-offer", deleteOffer)
export default router;