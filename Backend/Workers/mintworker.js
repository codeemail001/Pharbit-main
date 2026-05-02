import { Worker } from "bullmq";
import { ethers } from "ethers";
import dotenv from "dotenv";
import abi from "../abi/Pharbit.json" assert { type: "json" };


import { redisConnection } from "../Queue/redis.js";
import { FindMeds } from "../Database/Product/Medicines/Get/FindMedicines.js";
import { OrgDetails } from "../Database/Users/Organization/FindOrganization.js";
import { decrypt } from "../Middleware/Database/EncryptDecrypt.js";
import { createBatch } from "../Database/Transfer/Batches/CreateBatch.js";


dotenv.config();

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const RPC_URL = process.env.SEPOLIA_RPC_URL;

const generateMetadataHash = (medicineData) => {
  const payload = JSON.stringify({
    medicineId: medicineData._id || medicineData.id,
    name: medicineData.name,
    manufacturer: medicineData.organization_id || medicineData.org_id,
    createdAt: medicineData.created_at || medicineData.createdAt,
  });

  return ethers.keccak256(ethers.toUtf8Bytes(payload));
};

new Worker(
  "mintQueue",
  async (job) => {
    try {
      const {
        medicineId,
        pricePerToken,
        supply,
        manufacturingDate,
        expiryDate,
        warehouseLocation,
        orgId,
        serial_numbers,
      } = job.data;

      console.log("Processing mint job:", job.id);

      /* =========================
         Fetch medicine
      ========================== */

      const meds = await FindMeds(medicineId);

      /* =========================
         Decrypt wallet
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
         Blockchain mint
      ========================== */

      const metadataHash = generateMetadataHash(meds.data);

      const tx = await contract.mintBatch(
        BigInt(supply),
        BigInt(pricePerToken || 0),
        metadataHash
      );

      const receipt = await tx.wait();

      const eventSignature = contract.interface.getEvent("BatchMinted");

      const log = receipt.logs.find(
        (l) => l.topics[0] === eventSignature.topicHash
      );

      if (!log) throw new Error("BatchMinted event not found");

      const parsedLog = contract.interface.parseLog(log);

      const blockchainBatchId = parsedLog.args.batchId.toString();

      /* =========================
         Database sync
      ========================== */

      const batchPayload = {
        medicine_id: medicineId,
        batch_number: blockchainBatchId,
        blockchain_tx_hash: receipt.hash,
        blockchain_network: "Sepolia",
        manufacturing_date:
          manufacturingDate || new Date().toISOString().split("T")[0],
        expiry_date: expiryDate,
        batch_quantity: supply,
        warehouse_location: warehouseLocation || "Main Warehouse",
        serial_numbers: serial_numbers,
      };

      const dbResult = await createBatch(batchPayload, orgId);

      if (!dbResult.success) {
        throw new Error(dbResult.error);
      }

      console.log("Mint job completed:", job.id);

    } catch (error) {
      console.error("Mint Worker Error:", error);
      throw error;
    }
  },
  {
    connection: redisConnection,
  }
);