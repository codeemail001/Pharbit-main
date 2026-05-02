import express from "express";
import dotenv from "dotenv";
import { FindOrganization, getAuthUser } from "../../Middleware/Database/AuthUser.js";
import { FindIncomingShipment, FindShipment, FindShipmentForDestination, FindShipmentForSource } from "../../Database/Transfer/Shipment/GetShipment.js";


dotenv.config();
const router = express.Router();

/* ============================================================
   Helper: Get Organization ID
============================================================ */

const getOrgIdFromRequest = async (req, res) => {
  const authUser = await getAuthUser(req);
  if (!authUser) {
    res.status(401).json({ success: false, error: "Unauthorized" });
    return null;
  }

  const orgResult = await FindOrganization(authUser.id);
  if (!orgResult.success) {
    res.status(404).json({ success: false, error: orgResult.error });
    return null;
  }

  return orgResult.data.id;
};

/* ============================================================
   1️⃣ Get Shipments Where Org Is Current Holder
============================================================ */

router.get("/shipments/current", async (req, res) => {
  try {
    const orgId = await getOrgIdFromRequest(req, res);
    if (!orgId) return;

    const shipments = await FindShipment(orgId);

    return res.status(200).json({
      success: true,
      count: shipments.length,
      data: shipments,
    });

  } catch (error) {
    console.error("Get Current Shipments Error:", error);
    return res.status(500).json({
      success: false,
      error: "Server error: " + error.message,
    });
  }
});



/* ============================================================
   1️⃣ Get Shipments Where Org Is Next Holder
============================================================ */

router.get("/shipments/next", async (req, res) => {
  try {
    const orgId = await getOrgIdFromRequest(req, res);
    if (!orgId) return;

    const shipments = await FindIncomingShipment(orgId);

    return res.status(200).json({
      success: true,
      count: shipments.length,
      data: shipments,
    });

  } catch (error) {
    console.error("Get Incoming Shipments Error:", error);
    return res.status(500).json({
      success: false,
      error: "Server error: " + error.message,
    });
  }
});

/* ============================================================
   2️⃣ Get Shipments Where Org Is Source
============================================================ */

router.get("/shipments/source", async (req, res) => {
  try {
    const orgId = await getOrgIdFromRequest(req, res);
    if (!orgId) return;

    const shipments = await FindShipmentForSource(orgId);

    return res.status(200).json({
      success: true,
      count: shipments.length,
      data: shipments,
    });

  } catch (error) {
    console.error("Get Source Shipments Error:", error);
    return res.status(500).json({
      success: false,
      error: "Server error: " + error.message,
    });
  }
});

/* ============================================================
   3️⃣ Get Shipments Where Org Is Destination
============================================================ */

router.get("/shipments/destination", async (req, res) => {
  try {
    const orgId = await getOrgIdFromRequest(req, res);
    if (!orgId) return;

    const shipments = await FindShipmentForDestination(orgId);

    return res.status(200).json({
      success: true,
      count: shipments.length,
      data: shipments,
    });

  } catch (error) {
    console.error("Get Destination Shipments Error:", error);
    return res.status(500).json({
      success: false,
      error: "Server error: " + error.message,
    });
  }
});

export default router;