import { Address } from "../model/addressSchema.js";
import { Cart } from "../model/cart.js";
import { Order } from "../model/orderSchema.js";
import { Product } from "../model/product.js";
import User from "../model/userModel.js";
import crypto from "crypto";
import { razorpayInstance } from "../utils/razorPay.js";
import mongoose from "mongoose";
import { Wallet } from "../model/walletSchema.js";
import { Coupon } from "../model/couponSchema.js";
import { v4 as uuidv4 } from "uuid";

////////////////////////////////////////////////////////////
//admin
export const allOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate("userId")
      .populate("addressId")
      .populate("products.productId");

    const allOrders = await Promise.all(
      orders.map(async (order) => {
        const productsWithVariants = await Promise.all(
          order.products.map(async (product) => {
            const fullProduct = await Product.findById(product.productId);
            const variant = fullProduct.variants.id(product.variantId);

            return {
              productId: product.productId._id,
              productName: product.productId.productName,
              price: product.productId.price,
              quantity: product.quantity,
              itemStatus: product.itemStatus,
              itemPaymentStatus: product.itemPaymentStatus,
              itemReturnReason: product.itemReturnReason,
              itemId: product._id,
              variant: variant
                ? {
                    color: variant.color,
                    images: variant.images,
                  }
                : null,
            };
          })
        );
        return {
          orderId: order._id,
          paymentMethod: order.paymentMethod,
          payableAmount: order.payableAmount,
          totalDiscount: order.totalDiscount,
          orderAt: order.orderAt,
          orderStatus: order.orderStatus,
          products: productsWithVariants,
          address: {
            fullName: order.addressId.fullName,
            email: order.addressId.email,
            phone: order.addressId.phone,
            country: order.addressId.country,
            state: order.addressId.state,
            city: order.addressId.city,
            landMark: order.addressId.landMark,
            pincode: order.addressId.pincode,
          },
        };
      })
    );
    res.status(200).json({ orders: allOrders });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server Error" });
  }
};
/////////////////////////////////////////////////////////////////
export const orderDetailsById = async (req, res) => {
  const { id } = req.params;
  console.log(id);

  try {
    const order = await Order.findOne({ _id: id })
      .populate("addressId")
      .populate("products.productId")
      .exec();

    if (!order) {
      res.status(404).json({ message: "The Order is not exist" });
    }

    const allPaid = await order.products.every(
      (product) => product.itemPaymentStatus == "Paid"
    );
    if (allPaid) {
      order.paymentStatus = "Paid";
      await order.save();
    }

    const uniqueStatuses = [
      ...new Set(order.products.map((product) => product.itemStatus)),
    ];

    for (let status of uniqueStatuses) {
      const isCommon = order.products.every(
        (product) => product.itemStatus == status
      );
      if (isCommon) {
        order.orderStatus = status;
        await order.save();
        break;
      }
    }

    const productsWithVariants = await Promise.all(
      order.products.map(async (product) => {
        const fullProduct = await Product.findById(product.productId);
        const variant = fullProduct.variants.id(product.variantId);

        return {
          productId: product.productId._id,
          productName: product.productId.productName,
          price: product.productPrice,
          discountPrice: product.productDiscountPrice,
          quantity: product.quantity,
          itemStatus: product.itemStatus,
          itemPaymentStatus: product.itemPaymentStatus,
          itemId: product._id,
          variant: variant
            ? {
                color: variant.color,
                images: variant.images,
              }
            : null,
        };
      })
    );

    const detailedOrder = {
      orderId: order._id,
      paymentMethod: order.paymentMethod,
      payableAmount: order.payableAmount,
      products: productsWithVariants,
      orderAt: order.orderAt,
      orderStatus: order.orderStatus,
      address: {
        fullName: order.addressId.fullName,
        email: order.addressId.email,
        phone: order.addressId.phone,
        country: order.addressId.country,
        state: order.addressId.state,
        city: order.addressId.city,
        landMark: order.addressId.landMark,
        pincode: order.addressId.pincode,
      },
    };
    res.status(200).json({ order: detailedOrder });
  } catch (error) {
    console.log(error);
  }
};
//////////////////////////////////////////////////////////////////////
export const updateOrderStatus = async (req, res) => {
  const { orderId, newStatus } = req.body;

  try {
    const order = await Order.updateOne(
      { _id: orderId },
      { $set: { orderStatus: newStatus } }
    );

    if (!order) {
      res.status(404).json({ message: "Order not found" });
    }
    // if(newStatus == "Cancelled") {
    //   const currentOrder = await Order.findById(orderId)

    //   await Promise.all(
    //     currentOrder.products.map(async(product) => {
    //       const fullProduct = await Product.findById(product.productId)
    //       const variant = fullProduct.variants.id(product.variantId)

    //       if(variant) {
    //         variant.quantity += product.quantity

    //         await fullProduct.save()
    //       }
    //     })
    //   )
    // }
    res.status(200).json(order);
  } catch (error) {}
};
///////////////////////////////////////////////////////
export const updateItemStatus = async (req, res) => {
  const { itemId, orderId, newStatus } = req.body;

  console.log(newStatus);

  try {
    const updatedOne = await Order.findOneAndUpdate(
      { _id: orderId, "products._id": itemId },
      { $set: { "products.$.itemStatus": newStatus } }
    );
    if (!updateItemStatus) {
      return res.status(404).json({ mesage: "Order not found" });
    }
    if (newStatus == "Cancelled") {
      const currentOrder = await Order.findById(orderId);
      const currentItem = currentOrder.products.id(itemId);
      const currentProduct = await Product.findOne({
        _id: currentItem.productId,
      });
      const currentVariant = currentProduct.variants.id(currentItem.variantId);

      currentVariant.stock += currentItem.quantity;

      await currentProduct.save();
    }
    if (newStatus == "Delivered") {
      await Order.findOneAndUpdate(
        { _id: orderId, "products._id": itemId },
        { $set: { "products.$.itemPaymentStatus": "Paid" } },
        { new: true }
      );
    }
    res.status(200).json(updatedOne);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
//////////////////////////////////////////////////////////////////////////
export const returnOrders = async (req, res) => {
  try {
    const returnOrders = await Order.find({
      products: { $elemMatch: { itemStatus: "Return Requested" } },
    }).populate("products.productId");

    res.status(200).json({ orders: returnOrders });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};
///////////////////////////////////////////////////////////////////////////////////
export const updateReturn = async (req, res) => {
  try {
    const { orderId, itemId, result } = req.body;

    console.log(orderId, itemId, result);

    const updatedOrder = await Order.findOneAndUpdate(
      {
        _id: orderId,
        "products._id": itemId,
      },
      { $set: { "products.$.itemStatus": result } },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(400).json({ message: "Order or product not found." });
    }

    const orderDetails = await Order.findOne(
      { _id: orderId },
      { paymentStatus: 1, userId: 1, _id: 0 }
    );

    const order = await Order.findById(orderId);
    const item = order.products.id(itemId);

    console.log(order);
    console.log(item);

    if (item.itemPaymentStatus === "Paid" && result === "Returned") {
      await Product.findOneAndUpdate(
        { _id: item.productId, "variants._id": item.variantId },
        { $inc: { "variants.$.stock": item.quantity } },
        { new: true }
      );

      const productPrice = item.productDiscountPrice
        ? item.productDiscountPrice
        : item.productPrice;

      const wallet = await Wallet.findOneAndUpdate(
        { userId: orderDetails.userId },
        {
          $inc: { balance: productPrice * item.quantity },
          $push: {
            transactions: {
              transactionId: uuidv4(),
              description: "Item Returned Refund",
              amount: productPrice * item.quantity,
              date: new Date(),
            },
          },
        },
        { new: true }
      );

      if (!wallet) {
        return res
          .status(400)
          .json({ message: "Wallet not found for the user." });
      }
    }

    res.status(200).json({ message: "Return updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
    console.error(error);
  }
};

//user controller
//////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////
export const placeOrder = async (req, res) => {
  const { userId } = req.user;
  if (!userId) {
    return res.status(404).json({ message: "User is not valid" });
  }

  const {
    addressId,
    paymentMethod,
    totalPrice,
    totalDiscount,
    couponUsed,
    couponCode,
  } = req.body;

  try {
    if (
      paymentMethod == "cash on delivery" ||
      paymentMethod == "pay from wallet"
    ) {
      const user = await User.findById(userId);

      const address = await Address.findOne({ _id: addressId, userId });
      if (!address)
        return res.status(404).json({ message: "Address not found" });

      const cart = await Cart.findOne({ userId }).populate(
        "items.productId",
        "price discountedPrice"
      );

      if (!cart || cart.items.length === 0)
        return res.status(400).json({ message: "Cart is empty" });

      const products = cart.items.map((item) => ({
        productId: item.productId._id,
        variantId: item.variantId,
        quantity: item.quantity,
        productPrice: item.productId.price,
        productDiscountPrice: item.productId.discountedPrice
          ? item.productId.discountedPrice
          : null,
        itemPaymentStatus:
          paymentMethod == "pay from wallet" ? "Paid" : "Pending",
      }));

      console.log(products);

      const payableAmount = products.reduce(
        (sum, product) => sum + product.productPrice * product.quantity,
        0
      );

      const newOrder = new Order({
        userId,
        addressId,
        paymentMethod,
        payableAmount: payableAmount - totalDiscount,
        totalDiscount: totalDiscount,
        paymentStatus: paymentMethod == "pay from wallet" ? "Paid" : "Pending",
        products,
      });

      for (let item of products) {
        const { productId, variantId, quantity } = item;

        const product = await Product.findOne({
          _id: productId,
          "variants._id": variantId,
        });

        const variant = product.variants.find((variant) =>
          variant._id.equals(variantId)
        );

        if (variant) {
          variant.stock = Math.max(0, variant.stock - quantity);
          await product.save();
        }
      }

      await newOrder.save();

      if (paymentMethod == "pay from wallet") {
        const wallet = await Wallet.findOneAndUpdate(
          { userId },
          {
            $inc: { balance: -(totalPrice - totalDiscount) },
            $push: {
              transactions: {
                transactionId: uuidv4(),
                amount: totalPrice - totalDiscount,
                description: "Order Payment",
                date: new Date(),
              },
            },
          },
          { new: true }
        );
      }

      if (couponUsed) {
        const coupon = await Coupon.findOne({ couponCode });

        if (coupon) {
          coupon.usedUsersId.push(userId);

          await coupon.save();
        }
      }
      // cart.items = [];
      // cart.totalPrice = 0;
      // cart.totalDiscount = 0;

      await cart.save();

      res.status(201).json({
        message: "Order placed successfully",
        order: newOrder,
      });
    }
    if (paymentMethod == "razorpay") {
      const options = {
        amount: (totalPrice - totalDiscount) * 100,
        currency: "INR",
        receipt: "receipt_" + Math.random().toString(36).substring(7),
      };

      const order = await razorpayInstance.orders.create(options);

      console.log(order);
      return res.status(200).json(order);
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
/////////////////////////////////////////////////////////////////
export const myOrders = async (req, res) => {
  const { userId } = req.user;
  if (!userId) {
    return res.status(404).json({ message: "User is not valid" });
  }

  try {
    const orders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .populate("addressId")
      .populate("products.productId")
      .exec();

    const detailedOrders = await Promise.all(
      orders.map(async (order) => {
        const productsWithVariants = await Promise.all(
          order.products.map(async (product) => {
            const fullProduct = await Product.findById(product.productId);
            const variant = fullProduct.variants.id(product.variantId);

            return {
              productId: product.productId._id,
              productName: product.productId.productName,
              price: product.productId.discountedPrice
                ? product.productId.discountedPrice
                : product.productId.price,
              quantity: product.quantity,
              itemStatus: product.itemStatus,
              variant: variant
                ? {
                    color: variant.color,
                    images: variant.images,
                  }
                : null,
            };
          })
        );
        return {
          orderId: order._id,
          paymentMethod: order.paymentMethod,
          payableAmount: order.payableAmount,
          products: productsWithVariants,
          orderAt: order.orderAt,
          orderStatus: order.orderStatus,
          paymentStatus: order.paymentStatus,
          address: {
            fullName: order.addressId.fullName,
            email: order.addressId.email,
            phone: order.addressId.phone,
            country: order.addressId.country,
            state: order.addressId.state,
            city: order.addressId.city,
            landMark: order.addressId.landMark,
            pincode: order.addressId.pincode,
          },
        };
      })
    );
    const wallet = await Wallet.findOne({ userId });

    res.status(200).json({
      success: true,
      orders: detailedOrders,
      walletBalance: wallet.balance,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
//////////////////////////////////////////////////////////////

export const razorPayPayment = async (req, res) => {
  try {
    const { userId } = req.user;

    const {
      totalPrice,
      totalDiscount,
      couponUsed,
      couponCode,
      addressId,
      paymentMethod,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      paymentStatus,
    } = req.body;
    console.log(
      totalPrice,
      totalDiscount,
      couponUsed,
      addressId,
      paymentMethod,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      paymentStatus
    );

    const sign = razorpayOrderId + "|" + razorpayPaymentId;
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET_KEY)
      .update(sign.toString())
      .digest("hex");

    // if (generatedSignature !== razorpaySignature) {
    //   return res.status(400).json({ message: "Invalid payment signature" });
    // }

    const cart = await Cart.findOne({ userId }).populate(
      "items.productId",
      "price discountedPrice"
    );

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }
    const products = cart.items.map((item) => ({
      productId: item.productId._id,
      variantId: item.variantId,
      quantity: item.quantity,
      productPrice: item.productId.price,
      productDiscountPrice: item.productId.discountedPrice
        ? item.productId.discountedPrice
        : null,
      itemPaymentStatus: paymentStatus == "failed" ? "Failed" : "Paid",
    }));

    const payableAmount = products.reduce(
      (sum, product) => sum + product.productPrice * product.quantity,
      0
    );

    const newOrder = new Order({
      userId,
      addressId,
      paymentMethod,
      payableAmount: totalPrice - totalDiscount,
      totalDiscount,
      paymentId: razorpayPaymentId,
      paymentStatus: paymentStatus == "failed" ? "Failed" : "Paid",
      orderStatus: "Pending",
      products,
    });

    if (paymentStatus != "failed") {
      for (let item of products) {
        const { productId, variantId, quantity } = item;

        const product = await Product.findOne({
          _id: productId,
          "variants._id": variantId,
        });

        const variant = product.variants.find((variant) =>
          variant._id.equals(variantId)
        );

        if (variant) {
          variant.stock = Math.max(0, variant.stock - quantity);
          await product.save();
        }
      }
    }

    await newOrder.save();

    if (couponUsed) {
      const coupon = await Coupon.findOne({ couponCode });

      if (coupon) {
        coupon.usedUsersId.push(userId);

        await coupon.save();
      }
    }

    // cart.items = [];
    // cart.totalPrice = 0;
    // cart.totalDiscount = 0;
    await cart.save();
    res.status(200).json({
      message: "Order placed successfully",
      order: newOrder,
    });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "Failed to verify payment and create order" });
  }
};
///////////////////////////////////////////////////////////
export const orderDetails = async (req, res) => {
  const { userId } = req.user;

  if (!userId) {
    return res.status(401).json({ message: "User is not valid" });
  }
  const { id } = req.params;
  try {
    const order = await Order.findOne({ _id: id, userId })
      .populate("addressId")
      .populate("products.productId")
      .exec();

    if (!order) {
      res.status(404).json({ message: "The Order is not exist" });
    }

    if (order.products.length > 0) {
      const firstStatus = order.products[0].itemStatus;
      const allSameStatus = order.products.every(
        (product) => product.itemStatus === firstStatus
      );

      if (allSameStatus) {
        order.orderStatus = firstStatus;
        await order.save();
      }
    }

    const allPaid = await order.products.every(
      (product) => product.itemPaymentStatus == "Paid"
    );
    if (allPaid) {
      order.paymentStatus = "Paid";
      await order.save();
    }

    const productsWithVariants = await Promise.all(
      order.products.map(async (product) => {
        const fullProduct = await Product.findById(product.productId);
        const variant = fullProduct.variants.id(product.variantId);

        return {
          productId: product.productId._id,
          productName: product.productId.productName,
          price: product.productPrice,
          discountPrice: product.productDiscountPrice,
          quantity: product.quantity,
          itemStatus: product.itemStatus,
          itemId: product._id,
          variant: variant
            ? {
                color: variant.color,
                images: variant.images,
              }
            : null,
        };
      })
    );

    const detailedOrder = {
      orderId: order._id,
      paymentMethod: order.paymentMethod,
      payableAmount: order.payableAmount,
      totalDiscount: order.totalDiscount,
      products: productsWithVariants,
      orderAt: order.orderAt,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      address: {
        fullName: order.addressId.fullName,
        email: order.addressId.email,
        phone: order.addressId.phone,
        country: order.addressId.country,
        state: order.addressId.state,
        city: order.addressId.city,
        landMark: order.addressId.landMark,
        pincode: order.addressId.pincode,
      },
    };

    res.status(200).json({ order: detailedOrder });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
///////////////////////////////////////////////////////////////
export const cancelOrder = async (req, res) => {
  const { userId } = req.user;
  if (!userId) {
    return res.status(404).json({ message: "User is not valid" });
  }
  const { id } = req.body;
  try {
    const currentOrder = await Order.findById(id);

    await Promise.all(
      currentOrder.products.map(async (product) => {
        const fullProduct = await Product.findById(product.productId);
        const variant = fullProduct.variants.id(product.variantId);

        if (
          variant &&
          product.itemStatus !== "Returned" &&
          product.itemStatus !== "Cancelled"
        ) {
          variant.stock += product.quantity;
          await fullProduct.save();
        }
      })
    );
    const order = await Order.updateOne(
      { _id: id },
      {
        $set: {
          orderStatus: "Cancelled",
          "products.$[].itemStatus": "Cancelled",
        },
      }
    );

    if (currentOrder.paymentStatus == "Paid") {
      await Wallet.findOneAndUpdate(
        { userId },
        {
          $inc: { balance: currentOrder.payableAmount },
          $push: {
            transactions: {
              transactionId: uuidv4(),
              description: "Order cancelled refund",
              amount: currentOrder.payableAmount,
              date: new Date(),
            },
          },
        },
        { new: true }
      );
    }
    if (!order) {
      return res.status(404).json({ message: "Order not existed" });
    }

    res.status(200).json({ message: "Order cancelled Successfully", order });
  } catch (error) {
    console.log(error);
  }
};
////////////////////////////////////////////////////////////////////////
export const cancelItem = async (req, res) => {
  const { userId } = req.user;
  if (!userId) {
    return res.status(404).json({ message: "User is not valid" });
  }

  const { orderId, itemId } = req.body;

  try {
    const updatedItem = await Order.findOneAndUpdate(
      {
        _id: orderId,
        "products._id": itemId,
      },
      { $set: { "products.$.itemStatus": "Cancelled" } },
      { new: true }
    );

    if (!updatedItem) {
      return res.status(404).json({ message: "Unable to cancel the item" });
    }

    const currentOrder = await Order.findById(orderId);
    const currentItem = currentOrder.products.id(itemId);
    const currentProduct = await Product.findOne({
      _id: currentItem.productId,
    });
    const currentVariant = currentProduct.variants.id(currentItem.variantId);

    currentVariant.stock += currentItem.quantity;

    await currentProduct.save();
    const refundingAmount = currentItem.productDiscountPrice
      ? currentItem.productDiscountPrice
      : currentItem.productPrice;

    if (currentItem.itemPaymentStatus == "Paid") {
      await Wallet.findOneAndUpdate(
        { userId },
        {
          $inc: { balance: refundingAmount * currentItem.quantity },
          $push: {
            transactions: {
              transactionId: uuidv4(),
              description: "Item cancelled in order",
              amount: refundingAmount * currentItem.quantity,
              date: new Date(),
            },
          },
        },
        { new: true }
      );
    }

    currentOrder.payableAmount -= refundingAmount * currentItem.quantity;

    currentOrder.save();

    res.status(200).json(updatedItem);
  } catch (error) {
    res.status(500).json({ message: "Internal sever error" });
    console.log(error);
  }
};
/////////////////////////////////////////////////////////////////////////////
export const returnItem = async (req, res) => {
  const { userId } = req.user;
  if (!userId) {
    return res.status(404).json({ message: "User is not valid" });
  }

  try {
    const { orderId, itemId, returnReason } = req.body;

    const updatedItem = await Order.findOneAndUpdate(
      {
        _id: orderId,
        "products._id": itemId,
      },
      {
        $set: {
          "products.$.itemStatus": "Return Requested",
          "products.$.itemReturnReason": returnReason,
        },
      },
      { new: true }
    );

    res.status(200).json({ message: "Return requested successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};
///////////////////////////////////////////////////////////////////////////////////
export const retryOrder = async (req, res) => {
  try {
    const { userId } = req.user;
    if (!userId) {
      return res.status(404).json({ message: "User is not valid" });
    }

    const { orderId, paymentMethod } = req.body;

    console.log(orderId, paymentMethod);
    const orderDetails = await Order.findById(orderId);

    if (paymentMethod == "wallet") {
      const updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        {
          $set: {
            paymentMethod: "pay from wallet",
            paymentStatus: "Paid",
            "products.$[].itemPaymentStatus": "Paid",
          },
        },
        { new: true }
      );

      if (!updatedOrder) {
        return res.status(400).json({ message: "Order not found" });
      }

      await Wallet.findOneAndUpdate(
        { userId },
        {
          $inc: { balance: -orderDetails.payableAmount },
          $push: {
            transactions: {
              transactionId: uuidv4(),
              description: "Order Payment",
              amount: orderDetails.payableAmount,
              date: new Date(),
            },
          },
        },
        { new: true }
      );

      const order = await Order.findById(orderId).populate("products.productId")


      for (let item of order.products) {
        const { productId, variantId, quantity } = item;
  
        const product = await Product.findOne({
          _id: productId,
          "variants._id": variantId,
        });
  
        const variant = product.variants.find((variant) =>
          variant._id.equals(variantId)
        );
  
        if (variant) {
          variant.stock = Math.max(0, variant.stock - quantity);
          await product.save();
        }
      }

      res
        .status(200)
        .json({ message: "Order paid successfully", updatedOrder });
    } else {
      const options = {
        amount: (orderDetails.payableAmount - orderDetails.totalDiscount) * 100,
        currency: "INR",
        receipt: "receipt_" + Math.random().toString(36).substring(7),
      };

      const order = await razorpayInstance.orders.create(options);

      console.log(order);
      return res.status(200).json(order);
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};
/////////////////////////////////////////////////////////////////
export const retryRazorpayPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    const {
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
      paymentStatus,
    } = req.body;

    const sign = razorpayOrderId + "|" + razorpayPaymentId;
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET_KEY)
      .update(sign.toString())
      .digest("hex");

    if (generatedSignature !== razorpaySignature) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        $set: {
          paymentId: razorpayPaymentId,
          paymentStatus: "Paid",
          "products.$[].itemPaymentStatus": "Paid",
        },
      },
      { new: true }
    );

    const order = await Order.findById(orderId).populate("products.productId")


    for (let item of order.products) {
      const { productId, variantId, quantity } = item;

      const product = await Product.findOne({
        _id: productId,
        "variants._id": variantId,
      });

      const variant = product.variants.find((variant) =>
        variant._id.equals(variantId)
      );

      if (variant) {
        variant.stock = Math.max(0, variant.stock - quantity);
        await product.save();
      }
    }


    res.status(200).json({message: "Order paid successfully"})
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};
