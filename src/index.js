import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "./app.js";
import { connectToDatabase } from "./utils/databaseUtils.js";

//dotenv config
dotenv.config();

//env variable
const PORT = process.env.PORT || 9000;

app.listen(PORT, async () => {
  await connectToDatabase();
  console.log(`server is listening at ${PORT} port`);
});
