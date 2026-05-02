import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

// Catch silent crashes
process.on("uncaughtException", (err) => {
  console.error("🔥 CRITICAL: Uncaught Exception:", err);
});
process.on("unhandledRejection", (reason, promise) => {
  console.error("🔥 CRITICAL: Unhandled Rejection at:", promise, "reason:", reason);
});

dotenv.config();

import Organization from "./Routes/Users/Organization.js"
import Autherization from "./Routes/Users/Auth.js"
import Employee from "./Routes/Users/Employee.js"
import Medicines from "./Routes/Medicine/PostingMeds.js"
import FetchMeds from "./Routes/Medicine/FetchingMeds.js"
import MintMeds from "./Routes/Medicine/MintingMedicine.js"
import Batches from "./Routes/Batches/FetchingBatch.js"
import CreateShipment from "./Routes/Transfer/CreatingShipment.js"
import FetchShipment from "./Routes/Transfer/GettingShipment.js"
import PassShip from "./Routes/Transfer/PassingShipment.js"
import RedeemShip from "./Routes/Transfer/RedeemShipment.js"
import UpdateShip from "./Routes/Transfer/UpdatingShipment.js"
import FreezeBatch from "./Routes/Batches/FreezingBatch.js"
import PackageOrder from "./Routes/Batches/PackingOrder.js"
import AdminControls from "./Routes/Admin/AdminControls.js"
import Permissions from "./Routes/Users/Permissions.js"

const app = express();
// Force 4500 to match your Railway domain settings
const PORT = process.env.NODE_ENV === "production" ? 4500 : (process.env.PORT || 4500);

app.use(cookieParser());

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "https://pharbit.netlify.app", // Add your Netlify URL here
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".netlify.app")) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

app.use(express.json({ type: "application/json" }));
app.use(express.urlencoded({ extended: true }));

// --- REQUEST LOGGER ---
app.use((req, res, next) => {
  console.log(`📡 Incoming Request: ${req.method} ${req.url}`);
  next();
});

// --- HEALTH CHECKS (MUST BE AT TOP) ---
app.get("/", (req, res) => {
  console.log("Health check hit at /");
  res.status(200).send("Pharbit API is running...");
});

app.get("/health", (req, res) => {
  console.log("Health check hit at /health");
  res.json({ status: "ok", port: PORT, env: process.env.NODE_ENV });
});

console.log("Attempting to start server...");
console.log("PORT:", PORT);
console.log("NODE_ENV:", process.env.NODE_ENV);
// ---------------------------------------

app.use("/", Organization);
app.use("/", Autherization);
app.use("/", Employee)
app.use("/", Medicines);
app.use("/", FetchMeds);
app.use("/", MintMeds);
app.use("/", Batches);
app.use("/", CreateShipment);
app.use("/", FetchShipment);
app.use("/", PassShip);
app.use("/", RedeemShip);
app.use("/", UpdateShip);
app.use("/", FreezeBatch);
app.use("/", PackageOrder)
app.use("/admin", AdminControls);
app.use("/", Permissions);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server strictly listening on 0.0.0.0:${PORT}`);
});