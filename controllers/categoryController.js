import { Category } from "../model/category.js";

export const addCategory = async (req, res) => {
  const { name, description } = req.body;

  try {
    await Category.create({
      name,
      description,
    });

    res.status(200).json({ message: "Category Successfully Created" });
  } catch (error) {
    res.status(500).json({ message: error.message });
    console.log(error);
  }
};
//////////////////////////////////////////////////////
export const allCategories = async (req, res) => {
  try {
    const allCategories = await Category.find();


    res.status(200).json(allCategories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
/////////////////////////////////////////////////////////
export const updateCategoryStatus = async (req, res) => {
  const { id } = req.params;
  const { listed } = req.body;

  try {
    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      { listed },
      { new: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({ message: "Category Not Found" });
    }

    res.status(200).json(updatedCategory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
///////////////////////////////////
export const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  try {
    if (!name || !description) {
      return res.status(400).json({
        message: "Name and description are required.",
      });
    }

    const category = await Category.findByIdAndUpdate(
      id,
      { name, description },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({
        message: "Category not found.",
      });
    }

    res.status(200).json({
      message: "Category updated successfully.",
      category,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
