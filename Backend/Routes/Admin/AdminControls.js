import express from "express";
import { ethers } from "ethers";
import dotenv from "dotenv";
import abi from "../../abi/Pharbit.json" with { type: "json" };
import { getAuthUser, FindRole } from "../../Middleware/Database/AuthUser.js";

dotenv.config();
const router = express.Router();
router.use(express.json());

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const RPC_URL = process.env.SEPOLIA_RPC_URL;
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;

// Helper to get Admin Contract Instance
const getAdminContract = () => {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signer = new ethers.Wallet(ADMIN_PRIVATE_KEY, provider);
  return new ethers.Contract(CONTRACT_ADDRESS, abi.abi || abi, signer);
};

// Middleware to enforce Admin role
const requireAdmin = async (req, res, next) => {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return res.status(401).json({ error: "Unauthorized" });

    const roleData = await FindRole(authUser.id);
    if (!roleData || roleData.role.toLowerCase() !== "admin") {
      return res.status(403).json({ error: "Forbidden: Admin access required" });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Apply to all admin routes
router.use(requireAdmin);


router.post("/pause", async (req, res) => {
  try {
    const { action } = req.body; // "pause" or "unpause"
    const contract = getAdminContract();
    
    let tx;
    if (action === "pause") {
      tx = await contract.pause();
    } else {
      tx = await contract.unpause();
    }
    
    await tx.wait();
    res.status(200).json({ success: true, message: `Network successfully ${action}d` });
  } catch (error) {
    console.error("Pause Error:", error);
    res.status(500).json({ error: error.message });
  }
});


router.post("/grant-company", async (req, res) => {
  try {
    const { walletAddress, action } = req.body; // "grant" or "revoke"
    if (!walletAddress) return res.status(400).json({ error: "Wallet address required" });

    const contract = getAdminContract();
    
    let tx;
    if (action === "grant") {
      tx = await contract.addCompany(walletAddress);
    } else {
      tx = await contract.removeCompany(walletAddress);
    }
    
    await tx.wait();
    res.status(200).json({ success: true, message: `Company role ${action}ed` });
  } catch (error) {
    console.error("Grant Company Error:", error);
    res.status(500).json({ error: error.message });
  }
});


router.post("/seize", async (req, res) => {
  try {
    const { from, to, batchId, amount } = req.body;
    if (!from || !to || batchId === undefined || !amount) {
      return res.status(400).json({ error: "Missing parameters" });
    }

    const contract = getAdminContract();
    const tx = await contract.seizeTokens(from, to, BigInt(batchId), BigInt(amount));
    await tx.wait();
    
    res.status(200).json({ success: true, message: "Tokens successfully seized" });
  } catch (error) {
    console.error("Seize Error:", error);
    res.status(500).json({ error: error.message });
  }
});


router.post("/resolve", async (req, res) => {
  try {
    const { txId, awardTo } = req.body;
    if (txId === undefined || !awardTo) {
      return res.status(400).json({ error: "Missing parameters" });
    }

    const contract = getAdminContract();
    const tx = await contract.resolveDispute(BigInt(txId), awardTo);
    await tx.wait();
    
    res.status(200).json({ success: true, message: "Dispute resolved successfully" });
  } catch (error) {
    console.error("Resolve Dispute Error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
