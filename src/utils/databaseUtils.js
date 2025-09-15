import mongoose from "mongoose";

export const connectToDatabase = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log("connected to mongoDB");
  } catch (error) {
    console.log("fail to connected with mongoDB server");
  }
};

export const checkDatabaseConnection = async (req, res, next) => {
  try {
    // Check if the database connection is alive
    if (mongoose.connection.readyState === 0) {
      console.log("Database disconnected. Reconnecting...");
      await connectToDatabase(); // Reconnect

      console.log("connection success");
    }
    next();
  } catch (error) {
    next(new Error("Database connection error"));
  }
};
