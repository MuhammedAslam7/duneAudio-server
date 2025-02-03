import { Coupon } from "../model/couponSchema.js    ";

export const addCoupon = async (req, res) => {
  try {
    const { couponCode, discountAmount, minPurchaseAmount, endDate } =
      req.body.values;

    const coupon = new Coupon({
      couponCode,
      discountAmount,
      minPurchaseAmount,
      expirationDate: endDate,
      usedUsersId: [],
    });

    await coupon.save();

    res.status(200).json({ message: "Coupon Added Successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
    console.log(error);
  }
};
////////////////////////////////////////////////////////////////////////////////////
export const allCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find();

    res.status(200).json(coupons);
  } catch (error) {
    res.status(500).json({ message: "server error" });
  }
};
///////////////////////////////////////////////////////////////////
export const couponById = async (req, res) => {
  try {
    const { id } = req.query;

    const coupon = await Coupon.findById(id);

    res.status(200).json({ coupon });

    console.log(id);
  } catch (error) {
    res.status(500).json({ message: "server error" });
  }
};
///////////////////////////////////////////////////////////////////
export const updateCouponStatus = async (req, res) => {
  try {
    const { couponId, status } = req.body;

    const coupon = await Coupon.findByIdAndUpdate(
      couponId,
      { listed: status },
      { new: true }
    );

    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }
    res.status(200).json(coupon);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};
////////////////////////////////////////////////////////////////////////
export const updateCoupon = async (req, res) => {
  try {
    const { id, values } = req.body;

    const updatedCoupon = await Coupon.findByIdAndUpdate(
      id,
      {
        couponCode: values.couponCode,
        discountAmount: values.discountAmount,
        minPurchaseAmount: values.minPurchaseAmount,
        expirationDate: values.expirationDate,
      },
      { new: true }
    );

    console.log(updatedCoupon)

    res.status(200).json(updateCoupon)
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};
//////////////////////////////////////////////////////////
export const deleteCoupon = async(req, res) => {
  try {
    const {couponId} = req.body

    const deleted = await Coupon.findByIdAndDelete(couponId)

    if(!deleted) {
      return res.status(404).json({message: "Coupon not found"})
    }

    res.status(200).json({message: "Coupon deleted"})

  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
}