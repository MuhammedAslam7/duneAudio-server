import express from "express";
import authRouter from "./authRoute.js";
import userRouter from "./userRoute.js";
import adminRouter from "./adminRoute.js";
const router = express.Router();

router.use("/auth", authRouter);
router.use("/user", userRouter);
router.use("/admin", adminRouter);

export { router };
