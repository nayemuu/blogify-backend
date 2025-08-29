import express from "express";
import authRoutes from "./authRoutes.js";
import tagRoutes from "./tagRoutes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/tags", tagRoutes);

export default router;
