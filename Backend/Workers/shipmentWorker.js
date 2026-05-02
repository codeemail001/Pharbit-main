import { Worker } from "bullmq";
import { redisConnection } from "../Queue/redis.js";

import { ethers } from "ethers";
import dotenv from "dotenv";
import abi from "../abi/Pharbit.json" assert { type: "json" };

import { OrgDetails } from "../Database/Users/Organization/FindOrganization.js";
import { decrypt } from "../Middleware/Database/EncryptDecrypt.js";
import { createShipment } from "../Database/Transfer/Shipment/CreateShipment.js";

dotenv.config();

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const RPC_URL = process.env.SEPOLIA_RPC_URL;

new Worker(
  "shipmentQueue",
  async (job) => {

    try {

      const {
        batch_id,
        blockchainBatchId,
        amount,
        receiver_org_id,
        receiverAddress,
        sender_org_id,
        pricePerToken
      } = job.data;

      console.log("Shipment job started:", job.id);

      /* Decrypt sender wallet */

      const organizationData = await OrgDetails(sender_org_id);

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

      /* Courier hash */

      const courierPayload = JSON.stringify({
        batch_id,
        sender: sender_org_id,
        receiver: receiver_org_id,
        timestamp: Date.now(),
      });

      const courierHash = ethers.keccak256(
        ethers.toUtf8Bytes(courierPayload)
      );

      /* Blockchain transfer */

      const tx = await contract.sendTokens(
        BigInt(blockchainBatchId),
        BigInt(amount),
        receiverAddress,
        BigInt(pricePerToken || 0),
        courierHash
      );

      const receipt = await tx.wait();

      /* Extract event */

      const eventSignature =
        contract.interface.getEvent("TransferInitiated");

      const log = receipt.logs.find(
        (l) => l.topics[0] === eventSignature.topicHash
      );

      if (!log) throw new Error("TransferInitiated event not found");

      const parsedLog = contract.interface.parseLog(log);

      const blockchainTxnId = parsedLog.args.txId.toString();

      /* Create shipment DB */

      const shipmentPayload = {
        batch_id,
        destination_org_id: receiver_org_id,
        medicines_amount: amount,
        txn_id: blockchainTxnId,
        deposit_tx_hash: receipt.hash,
      };

      const shipmentResult = await createShipment(
        shipmentPayload,
        sender_org_id
      );

      if (!shipmentResult.success) {
        throw new Error(shipmentResult.error);
      }

      console.log("Shipment job completed:", job.id);

    } catch (error) {

      console.error("Shipment worker error:", error);

      throw error;
    }

  },
  {
    connection: redisConnection
  }
);