import express from "express"
import { allOrders, orderDetailsById, returnOrders, updateItemStatus, updateOrderStatus, updateReturn } from "../controllers/orderControllers.js"

const router = express.Router()


router.get("/all-orders",  allOrders)
router.get("/order-details/:id",  orderDetailsById)
router.patch("/update-order-status",  updateOrderStatus)
router.patch("/update-item-status",  updateItemStatus)
router.get("/return-orders",  returnOrders)
router.patch("/update-return",  updateReturn)



export default router