import { Worker } from "bullmq";
import { ethers } from "ethers";
import dotenv from "dotenv";
import abi from "../abi/Pharbit.json" assert { type: "json" };

import { redisConnection } from "../Queue/redis.js";
import { OrgDetails } from "../Database/Users/Organization/FindOrganization.js";
import { decrypt } from "../Middleware/Database/EncryptDecrypt.js";
import { freezeBatch } from "../Database/Transfer/Batches/FreezeBatch.js";


dotenv.config();

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const RPC_URL = process.env.SEPOLIA_RPC_URL;

new Worker(
  "freezeQueue",
  async (job) => {
    try {

      const { batchId, orgId, recallReason } = job.data;

      console.log("Processing freeze job:", job.id);

      /* =========================
         Decrypt organization wallet
      ========================== */

      const organizationData = await OrgDetails(orgId);

      const encryptionPayload = {
        content: organizationData.wallet_encrypted,
        iv: organizationData.wallet_iv,
        tag: organizationData.wallet_tag,
      };

      const privateKey = decrypt(encryptionPayload);

      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const signer = new ethers.Wallet(privateKey, provider);

      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        abi.abi || abi,
        signer
      );

      /* =========================
         Blockchain Freeze
      ========================== */

      const tx = await contract.freezeBatch(BigInt(batchId));

      const receipt = await tx.wait();

      console.log("Batch frozen on blockchain:", receipt.hash);

      /* =========================
         Database Update
      ========================== */

      const dbResult = await freezeBatch(batchId, orgId, recallReason);

      if (!dbResult.success) {
        throw new Error(dbResult.error);
      }

      console.log("Freeze job completed:", job.id);

    } catch (error) {

      console.error("Freeze Worker Error:", error);
      throw error;

    }
  },
  {
    connection: redisConnection,
  }
);