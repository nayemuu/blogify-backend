import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "./app.js";

//dotenv config
dotenv.config();

//env variable
const PORT = process.env.PORT || 9000;

export const connectToDatabase = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log("connected to mongoDB");
  } catch (error) {
    console.log("fail to connected with mongoDB server");
  }
};

app.listen(PORT, async () => {
  await connectToDatabase();
  console.log(`server is listening at ${PORT} port`);
});
