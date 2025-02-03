import { Category } from "../model/category.js";
import { Offer } from "../model/offerSchema.js";
import { Order } from "../model/orderSchema.js";

import { Product } from "../model/product.js";

export const getProductAndCategories = async (req, res) => {
  try {
    const products = await Product.find();

    const categories = await Category.find();

    res.status(200).json({ products, categories });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const addOffer = async (req, res) => {
  try {
    const {
      title,
      description,
      discountType,
      discountValue,
      applicationType,
      categoryId,
      productId,
      startDate,
      endDate,
    } = req.body.values;

    console.log(
      title,
      description,
      discountType,
      discountValue,
      applicationType,
      categoryId,
      productId,
      startDate,
      endDate
    );

    const offer = new Offer({
      title,
      description,
      discountType,
      discountValue,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      products: applicationType === "product" ? productId : [],
      categories: applicationType === "category" ? categoryId : [],
    });

    await offer.save();

    if (applicationType == "product") {
      const products = await Product.find({
        _id: { $in: productId },
        listed: true,
      });

      await Promise.all(
        products.map(async (product) => {
          product.offers.push(offer._id);
          await product.save();
        })
      );
    } else {
      const products = await Product.find({
        category: { $in: categoryId },
        listed: true,
      });

      await Promise.all(
        products.map(async (product) => {
          product.offers.push(offer._id);
          await product.save();
        })
      );
    }

    res.status(201).json({
      success: true,
      message: "Offer created successfully",
    });
  } catch (error) {
    console.error("Error in addOffer:", error);
    res.status(500).json({
      success: false,
      message: "Error creating offer",
      error: error.message,
    });
  }
};
///////////////////////////////////////////////////////////////
export const updateOffer = async (req, res) => {
  try {
    const { id, values } = req.body;

    const offer = await Offer.findById(id);
    if (!offer) {
      return res.status(404).json({ message: "Offer not found" });
    }

    await Product.updateMany(
      { offers: offer._id },
      { $pull: { offers: offer._id } }
    );

    const updatedOffer = await Offer.findByIdAndUpdate(
      id,
      {
        $set: {
          title: values.title,
          description: values.description,
          discountType: values.discountType,
          discountValue: values.discountValue,
          startDate: new Date(values.startDate),
          endDate: new Date(values.endDate),
          products: values.applicationType === "product" ? values.productId : [],
          categories: values.applicationType === "category" ? values.categoryId : [],
        },
      },
      { new: true, runValidators: true }
    );

    if (!updatedOffer) {
      return res.status(404).json({ message: "Offer not found after update" });
    }

    const productsToUpdate =
      values.applicationType === "product"
        ? await Product.find({
            _id: { $in: values.productId },
            listed: true,
          })
        : await Product.find({
            category: { $in: values.categoryId },
            listed: true,
          });

    await Promise.all(
      productsToUpdate.map(async (product) => {
        product.offers.push(updatedOffer._id);
        await product.save();
      })
    );

    res.status(200).json({ message: "Offer successfully updated", updatedOffer });
  } catch (error) {
    console.error("Error updating offer:", error);
    res.status(500).json({ message: "Server error" });
  }
};
///////////////////////////////////////////////////////////
export const getOffers = async (req, res) => {
  try {
    const offers = await Offer.find()
      .populate("products", "productName price")
      .populate("categories", "name");
    res.status(200).json(offers);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch offers" });
  }
};
//////////////////////////////////////////////////////////////
export const getOfferById = async (req, res) => {
  try {
    const { id } = req.query;
    const offer = await Offer.findById(id)
      .populate("products", "productName price")
      .populate("categories", "name");
    console.log(offer);

    res.status(200).json(offer)
  } catch (error) {
    res.status(500).json({message: "Server Error"})
  }
};
/////////////////////////////////////////////////////////////
export const updateOfferStatus = async (req, res) => {
  try {
    const { offerId, status } = req.body;

    const updatedOffer = await Offer.findByIdAndUpdate(
      offerId,
      { listed: status },
      { new: true }
    );
    if (!updatedOffer) {
      return res.status(404).json({ message: "Offer not found" });
    }
    res.status(200).json(updatedOffer);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};
////////////////////////////////////////////////////////////////
export const deleteOffer = async (req, res) => {
  try {
    const { offerId } = req.body;

    const offer = await Offer.findById(offerId);
    if (!offer) {
      return res.status(404).json({ message: "Offer not existing" });
    }

    if (offer.products.length > 0) {
      await Promise.all(
        offer.products.map(async (id) => {
          await Product.findByIdAndUpdate(
            id,
            { $pull: { offers: offer._id } },
            { new: true }
          );
        })
      );
    }

    if (offer.categories.length > 0) {
      await Promise.all(
        offer.categories.map(async (catId) => {
          const category = await Category.findById(catId);
          const products = await Product.find({ category: category._id });

          await Promise.all(
            products.map(async (product) => {
              await Product.findByIdAndUpdate(
                product._id,
                { $pull: { offers: offer._id } },
                { new: true }
              );
            })
          );
        })
      );
    }

    await Offer.findByIdAndDelete(offerId);

    res.status(200).json({ message: "offer deleted successfully" });
  } catch (error) {}
};
/////////////////////////////////////////////////////////////
export const getProductsWithOffers = async (req, res) => {
  try {
    const currentDate = new Date();

    const products = await Product.aggregate([
      {
        $match: { listed: true },
      },
      {
        $lookup: {
          from: "offers",
          let: {
            productId: "$_id",
            categoryId: "$category",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $lte: ["$startDate", currentDate] },
                    { $gte: ["$endDate", currentDate] },
                    { $eq: ["$listed", true] },
                    {
                      $or: [
                        { $in: ["$$productId", "$products"] },
                        { $in: ["$$categoryId", "$categories"] },
                      ],
                    },
                  ],
                },
              },
            },
          ],
          as: "activeOffers",
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
      {
        $addFields: {
          categoryDetails: { $arrayElemAt: ["$categoryDetails", 0] },
          hasActiveOffer: { $gt: [{ $size: "$activeOffers" }, 0] },
          bestOffer: {
            $reduce: {
              input: "$activeOffers",
              initialValue: null,
              in: {
                $cond: {
                  if: {
                    $or: [
                      { $eq: ["$$value", null] },
                      {
                        $gt: [
                          { $ifNull: ["$$this.discountValue", 0] },
                          { $ifNull: ["$$value.discountValue", 0] },
                        ],
                      },
                    ],
                  },
                  then: "$$this",
                  else: "$$value",
                },
              },
            },
          },
        },
      },
      {
        $addFields: {
          discountedPrice: {
            $cond: {
              if: { $eq: ["$hasActiveOffer", true] },
              then: {
                $cond: {
                  if: { $eq: ["$bestOffer.discountType", "percentage"] },
                  then: {
                    $subtract: [
                      "$price",
                      {
                        $multiply: [
                          "$price",
                          { $divide: ["$bestOffer.discountValue", 100] },
                        ],
                      },
                    ],
                  },
                  else: {
                    $subtract: ["$price", "$bestOffer.discountValue"],
                  },
                },
              },
              else: "$price",
            },
          },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching products with offers",
      error: error.message,
    });
  }
};
