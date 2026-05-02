import { Worker } from "bullmq";
import { redisConnection } from "../Queue/redis.js";

import { redeemShipment } from "../Database/Transfer/Shipment/RedeemShipment.js";

new Worker(
  "redeemQueue",
  async (job) => {

    try {

      const { shipment_id, orgId } = job.data;

      console.log("Redeem job started:", job.id);

      const result = await redeemShipment({ shipment_id }, orgId);

      if (!result.success) {
        throw new Error(result.error);
      }

      console.log("Redeem job completed:", job.id);

    } catch (error) {

      console.error("Redeem worker error:", error);

      throw error;
    }

  },
  {
    connection: redisConnection
  }
);