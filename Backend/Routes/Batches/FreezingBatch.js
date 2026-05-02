import express from "express";
import dotenv from "dotenv";
import { freezeQueue, recallQueue } from "../../Queue/queue.js";

import supabase from "../../Middleware/Database/DatabaseConnect.js";

import { getAuthUser, FindOrganization } from "../../Middleware/Database/AuthUser.js";
import { FindMeds } from "../../Database/Product/Medicines/Get/FindMedicines.js";

dotenv.config();
const router = express.Router();

router.post("/freeze-batch", async (req, res) => {
  try {

    const { batchId, recallReason , medicineId } = req.body;
    const authUser = await getAuthUser(req);
    if (!authUser) return res.status(401).json({ error: "Unauthorized" });

    const orgResult = await FindOrganization(authUser.id);

    if (!orgResult.success) {
      return res.status(404).json({ error: orgResult.error });
    }

    const meds = await FindMeds(medicineId);
    if (!meds || !meds.data)
      return res.status(404).json({ error: "Medicine not found" });

    if (meds.data.organization_id !== orgResult.data.id) {
      return res.status(403).json({
        error: "You don't own this medicine record",
      });
    } 


     const { data, error } = await supabase
      .from("batches")
      .select("blockchain_mint_id")
       .eq("id", batchId)
    .eq("is_active" , true )

    if (error || !data) {
      return res.status(404).json({
        error: "Batch not found or inactive",
      });
    }

    const blockchainBatchId = data[0].blockchain_mint_id;
    console.log("Blockchain batch ID:", blockchainBatchId);

    /* =========================
       Add job to queue
    ========================== */

      await freezeQueue.add("freezeBatch", {
      batchId: blockchainBatchId,   // 👈 IMPORTANT
      orgId: orgResult.data.id,
      recallReason: recallReason || "Quality recall",
    });

    return res.status(200).json({
      success: true,
      message: "Freeze request queued. Processing in background.",
    });

  } catch (error) {

    console.error("Freeze Queue Error:", error);

    res.status(500).json({
      error: "Freeze request failed: " + error.message,
    });
  }
});

router.post("/redeem-recall-batch", async (req, res) => {
  try {

    const { shipment_id, tracking_code } = req.body;

    const authUser = await getAuthUser(req);
    if (!authUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const orgResult = await FindOrganization(authUser.id);

    if (!orgResult.success) {
      return res.status(404).json({ error: orgResult.error });
    } 

    await recallQueue.add("recallBatch", {
      shipment_id,
      tracking_code , 
      orgId: orgResult.data.id,
    });

    return res.status(200).json({
      success: true,
      message: "Recall request queued. Processing in background.",
    });

  } catch (error) {

    console.error("Recall Queue Error:", error);

    return res.status(500).json({
      error: "Recall request failed: " + error.message,
    });
  }
});

export default router;