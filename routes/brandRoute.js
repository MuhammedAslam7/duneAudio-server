import express from "express";
import {
  addBrand,
  allBrands,
  updateBrand,
  updateBrandStatus,
} from "../controllers/brandController.js";

const router = express.Router();

router.post("/add-brand", addBrand);
router.get("/all-brands", allBrands);
router.patch("/update-status/:id", updateBrandStatus);
router.put("/update-brand/:id", updateBrand);

export default router;
