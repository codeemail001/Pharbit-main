import express from "express";
import dotenv from "dotenv";

import { getAuthUser, FindOrganization } from "../../Middleware/Database/AuthUser.js";
import { redeemQueue } from "../../Queue/queue.js";

dotenv.config();
const router = express.Router();

/* ============================================================
   POST /redeem-shipment
============================================================ */

router.post("/redeem-shipment", async (req, res) => {
  try {

    const { shipment_id } = req.body;

    if (!shipment_id) {
      return res.status(400).json({
        success: false,
        error: "Shipment ID is required",
      });
    }

    /* AUTH */

    const authUser = await getAuthUser(req);
    if (!authUser) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    const orgResult = await FindOrganization(authUser.id);

    if (!orgResult.success) {
      return res.status(404).json({
        success: false,
        error: orgResult.error,
      });
    }

    const orgId = orgResult.data.id;

    /* Add redeem job to queue */

    await redeemQueue.add("redeemShipment", {
      shipment_id,
      orgId
    });

    return res.status(200).json({
      success: true,
      message: "Redeem request queued. Processing in background."
    });

  } catch (error) {

    console.error("Redeem Queue Error:", error);

    return res.status(500).json({
      success: false,
      error: "Server error: " + error.message,
    });

  }
});

export default router;