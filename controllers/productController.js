import { Product } from "../model/product.js";
import { Category } from "../model/category.js";
import { Brand } from "../model/brand.js";
import { Offer } from "../model/offerSchema.js";
//////////////////////////////////////////////////////////
export const addProduct = async (req, res) => {
  try {
    const {
      productName,
      color,
      description,
      price,
      stock,
      categoryName,
      brandName,
      images,
    } = req.body;
    const category = await Category.findOne({ name: categoryName });
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    const brand = await Brand.findOne({ name: brandName });

    if (!brand) {
      return res.status(404).json({ message: "Brand Not found" });
    }

    const product = new Product({
      productName,
      description,
      price,
      totalStock: stock,
      category,
      brand,
      thumbnailImage: images[0],
      variants: [{ color, stock, images }],
      offers: []
    });

    const offers = await Offer.find({categories: category})

    if(offers.length > 0){
      product.offers = offers.map((offer) => offer._id)
    }

    await product.save();
    res.status(201).json({ message: "Product added successfully", product });
  } catch (error) {
    console.log(error.message);
    res
      .status(500)
      .json({ message: "Failed to add product", error: error.message });
  }
};
/////////////////////////////////////////////////////////
export const addVariants = async (req, res) => {
  const { productId } = req.params;
  const { color, stock, images } = req.body.productData;
  console.log(productId, color, stock, images);

  if (!color || !stock || !images) {
    return res
      .status(400)
      .json({ message: "All fields are required for adding Variant" });
  }
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      {
        $push: { variants: { color, stock, images } },
      },
      { new: true, runValidators: true }
    );
    if (!updatedProduct) {
      return res.status(404).json({ message: "Product Not Found" });
    }
    res
      .status(200)
      .json({ message: "Varinat added Successfully", updatedProduct });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const { page, limit } = req.query;
    console.log(page, limit)
    const skip = (page - 1) * limit;

    const allProducts = await Product.find()
      .skip(skip)
      .limit(Number(limit))
      .populate("category")
      .populate("brand").sort({createdAt: -1})

      const totalProducts = await Product.countDocuments();
      const totalPage = Math.ceil(totalProducts / limit)

      const currentPage = page

      const fullProducts = await Product.find()
    res.status(200).json({products: allProducts, totalPage, currentPage, totalProducts, fullProducts});
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message });
  }
};
////////////////////////////////////////////////////////////
export const updateProductStatus = async (req, res) => {
  const { id } = req.params;
  const { listed } = req.body;

  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { listed },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product Not found" });
    }

    res.json(updatedProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
///////////////////////////////////////////////////////////////////
export const getProductById = async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Product.findById(id)
      .populate("category")
      .populate("brand")
      .populate("offers");

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const categories = await Category.find({}, {name: 1})

    res.status(200).json({product, categories});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

///////////////////////////////////////////////////////////////
export const editProduct = async (req, res) => {
  try {
    const {id, formData} = req.body

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const brand = await Brand.findOne({name: formData.brand})

    if(!brand) {
      return res.status(404).json({message: "Brand is not found"})
    }
    const brandId = brand._id
    const category = await Category.findOne({name: formData.category})
    if(!category) {
      return res.status(404).json({message: "Category is not found"})
    }
    const categoryId = category._id


    product.productName = formData.productName
    product.description = formData.description
    product.price = formData.price
    product.category = categoryId
    product.brand = brandId
    product.variants = formData.variants
    product.offers = []

    await product.save()
    console.log(product)

    const offers = await Offer.find({
      $or: [
        { categories: product.category },
        { products: product._id }      
      ]
    });

    console.log(offers)

    await Product.findByIdAndUpdate(product._id, {$set: {offers: offers}})

    res.status(200).json({
      message: "Product updated successfully",
      updatedProduct: product,
    });
    
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ message: "Internal Server Error", error });
    
  }

 

};
/////////////////////////////////////////////////////////////////
export const getBrandAndCategory = async (req, res) => {
  try {
    const category = await Category.find({}, { name: 1, _id: 0 });
    const brands = await Brand.find({}, { name: 1, _id: 0 });

    res
      .status(200)
      .json({
        message: "Brands and catagories",
        categories: category.map((category) => category.name),
        brands: brands.map((brand) => brand.name),
      });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
