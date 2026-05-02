import express from "express";
import dotenv from "dotenv";
import { shipmentQueue } from "../../Queue/queue.js";

import { getAuthUser, FindOrganization } from "../../Middleware/Database/AuthUser.js";
import { FindBatchbyId } from "../../Database/Transfer/Batches/FetchBatch.js";
import { OrgDetails } from "../../Database/Users/Organization/FindOrganization.js";

dotenv.config();
const router = express.Router();

router.post("/create-shipment", async (req, res) => {
  try {

    const { batch_id, amount, receiver_org_id, pricePerToken } = req.body;

    /* AUTH */

    const authUser = await getAuthUser(req);
    if (!authUser) return res.status(401).json({ error: "Unauthorized" });

    const orgResult = await FindOrganization(authUser.id);
    if (!orgResult.success)
      return res.status(404).json({ error: orgResult.error });

    const orgId = orgResult.data.id;

    /* Fetch Batch */

    const batch = await FindBatchbyId(batch_id);
    if (!batch.success)
      return res.status(404).json({ error: "Batch not found" });

    const blockchainBatchId = batch.data.blockchain_mint_id;

    /* Receiver Wallet */

    const receiverOrg = await OrgDetails(receiver_org_id);
    if (!receiverOrg.wallet_address)
      return res.status(400).json({ error: "Receiver wallet missing" });

    const receiverAddress = receiverOrg.wallet_address;

    /* Add job to queue */

    await shipmentQueue.add("createShipment", {
      batch_id,
      blockchainBatchId,
      amount,
      receiver_org_id,
      receiverAddress,
      sender_org_id: orgId,
      pricePerToken
    });

    res.status(200).json({
      success: true,
      message: "Shipment request queued. Processing in background."
    });

  } catch (error) {

    console.error("Shipment Queue Error:", error);

    res.status(500).json({
      error: "Shipment initiation failed: " + error.message
    });

  }
});

export default router;