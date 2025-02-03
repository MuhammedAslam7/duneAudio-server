import mongoose from "mongoose";

export const connectDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(`Database Connected:`);
  } catch (error) {
    console.log(`Error connecting mongodb${error.message}`);
    process.exit(1);
  }
};
