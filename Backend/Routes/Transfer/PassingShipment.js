import express from "express";
import dotenv from "dotenv";

import { FindOrganization, getAuthUser } from "../../Middleware/Database/AuthUser.js";
import { PassShipment } from "../../Database/Transfer/Shipment/PassShipment.js";
import { RecallShipment } from "../../Database/Transfer/Shipment/RecallShipment.js";

dotenv.config();
const router = express.Router();

router.post("/pass-shipment", async (req, res) => {
  try { 
    const { shipment_id, batch_id, next_holder_org_id, temperature } = req.body;
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const orgResult = await FindOrganization(authUser.id);
    if (!orgResult.success) {
      return res.status(404).json({ error: orgResult.error });
    }

    const orgId = orgResult.data.id;

    /* =========================
       2️⃣ Call PassShipment
    ========================== */ 
    const result = await PassShipment(
      { shipment_id, batch_id, next_holder_org_id, temperature },
      orgId
    );

    if (!result.success) {
      return res.status(result.status || 400).json({
        success: false,
        error: result.error,
      });
    }

    /* =========================
       3️⃣ Success Response
    ========================== */
    return res.status(200).json({
      success: true,
      message: result.message,
      new_tracking_code: result.new_tracking_code,
      shipment: result.data,
    });

  } catch (error) {
    console.error("Pass Shipment Route Error:", error);
    return res.status(500).json({
      success: false,
      error: "Server error: " + error.message,
    });
  }
});


router.post("/recall-shipment", async (req, res) => {
  try {

    const { shipment_id } = req.body;

    if (!shipment_id) {
      return res.status(400).json({
        success: false,
        error: "Shipment ID is required",
      });
    }

    /* =========================
       1️⃣ Authenticate User
    ========================== */

    const authUser = await getAuthUser(req);

    if (!authUser) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    /* =========================
       2️⃣ Fetch Organization
    ========================== */

    const orgResult = await FindOrganization(authUser.id);

    if (!orgResult.success) {
      return res.status(404).json({
        success: false,
        error: orgResult.error,
      });
    }

    const orgId = orgResult.data.id;

    /* =========================
       3️⃣ Recall Shipment Logic
    ========================== */

    const result = await RecallShipment(shipment_id, orgId);

    if (!result.success) {
      return res.status(result.status || 400).json({
        success: false,
        error: result.error,
      });
    }

    /* =========================
       4️⃣ Success Response
    ========================== */

    return res.status(200).json({
      success: true,
      message: result.message,
      new_tracking_code: result.new_tracking_code,
      shipment: result.data,
    });

  } catch (error) {

    console.error("Recall Shipment Route Error:", error);

    return res.status(500).json({
      success: false,
      error: "Server error: " + error.message,
    });
  }
});

export default router;