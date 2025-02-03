import express from "express";
import { allUsers, updateUserStatus } from "../controllers/usersControllers.js";
const router = express.Router();

router.get("/all-users", allUsers);
router.patch("/update-status/:id", updateUserStatus);

export default router;
