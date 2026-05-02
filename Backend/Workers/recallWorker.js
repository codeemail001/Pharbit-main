import { Worker } from "bullmq";
import { ethers } from "ethers";
import dotenv from "dotenv";
import abi from "../abi/Pharbit.json" assert { type: "json" };

import { redisConnection } from "../Queue/redis.js";
import { ReturnShipment } from "../Database/Transfer/Shipment/ReturnShipment.js";
import { OrgDetails } from "../Database/Users/Organization/FindOrganization.js";
import { decrypt } from "../Middleware/Database/EncryptDecrypt.js";

dotenv.config();

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const RPC_URL = process.env.SEPOLIA_RPC_URL;
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;

new Worker(
  "recallQueue",
  async (job) => {
    try {

      const { shipment_id, tracking_code, orgId } = job.data;

      console.log("Processing recall return:", shipment_id);

      /* =========================
         1️⃣ DB Return Logic
      ========================== */

      const dbResult = await ReturnShipment(shipment_id, tracking_code, orgId);

      if (!dbResult.success) {
        throw new Error(dbResult.error);
      }

      const batchId = dbResult.batch_blockchain_id;
      const amount = dbResult.amount;
      const returnSource = dbResult.returnSource;

      console.log(batchId);

      const provider = new ethers.JsonRpcProvider(RPC_URL);

      let signer;

      /* =========================
         2️⃣ Select Wallet
      ========================== */

      if (returnSource === "ESCROW") {

        console.log("Using ADMIN wallet (escrow release)");

        signer = new ethers.Wallet(
          ADMIN_PRIVATE_KEY,
          provider
        );

      } else if (returnSource === "ORGANIZATION") {

        console.log("Using ORGANIZATION wallet");

        const organizationData = await OrgDetails(orgId);

        const encryptionPayload = {
          content: organizationData.wallet_encrypted,
          iv: organizationData.wallet_iv,
          tag: organizationData.wallet_tag,
        };

        const privateKey = decrypt(encryptionPayload);

        signer = new ethers.Wallet(privateKey, provider);

      } else {

        throw new Error("Invalid returnSource type");

      }

      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        abi.abi || abi,
        signer
      );

      /* =========================
         3️⃣ Call Smart Contract
      ========================== */

      const tx = await contract.returnFrozenTokens(
        BigInt(batchId),
        BigInt(amount)
      );

      console.log("Blockchain tx sent:", tx.hash);

      const receipt = await tx.wait();

      console.log("Recall return confirmed:", receipt.hash);

      return {
        shipment_id,
        batchId,
        amount,
        txHash: receipt.hash
      };

    } catch (error) {

      console.error("Recall Worker Error:", error);
      throw error;
    }
  },
  {
    connection: redisConnection,
  }
);