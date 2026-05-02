import express from "express";
import { FindOrganization, getAuthUser } from "../../Middleware/Database/AuthUser.js";
import { FindBatch, FindBatchbyId, FindOrganizationBatch, FindTransferedBatch } from "../../Database/Transfer/Batches/FetchBatch.js";

const router = express.Router();

// 1. Fetch Batches specific to the Logged-in Organization
router.get("/OrgBatches", async (req, res) => {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return res.status(401).json({ error: "Unauthorized" });

    const orgdata = await FindOrganization(authUser.id);
    if (!orgdata || !orgdata.data) {
      return res.status(404).json({ error: "Organization not found" });
    }

    // Role-based Access Control
    const allowedRoles = ["manager", "employee", "admin", "owner"]; 
    if (!allowedRoles.includes(orgdata.role)) {
      console.log("Access Denied (OrgBatches) - Role:", orgdata.role, "Allowed:", allowedRoles);
      return res.status(403).json({ error: "Access denied" });
    }

    const orgId = orgdata.data.id;
    const batches = await FindOrganizationBatch(orgId);

    return res.status(200).json({
      success: true,
      count: batches.length,
      data: batches
    });

  } catch (err) {
    console.error("Error fetching OrgBatches:", err);
    return res.status(500).json({ error: "Failed to fetch Organization Batches" });
  }
});

// 2. Fetch All Active Batches (Global)
router.get("/FetchBatches", async (req, res) => {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return res.status(401).json({ error: "Unauthorized" });

    const batches = await FindBatch();

    return res.status(200).json({
      success: true,
      count: batches.length,
      data: batches
    });

  } catch (err) {
    console.error("Error fetching all Batches:", err);
    return res.status(500).json({ error: "Failed to fetch all Batches" });
  }
});

// 3. Fetch Single Batch by ID
// Fixed: Added "/" and corrected parameter extraction
router.get("/FetchBatch/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const authUser = await getAuthUser(req);

    if (!authUser) return res.status(401).json({ error: "Unauthorized" });

    const result = await FindBatchbyId(id);

    if (!result.success) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.status(200).json({
      success: true,
      data: result.data
    });

  } catch (err) {
    console.error("Error fetching Batch by ID:", err);
    return res.status(500).json({ error: "Internal Server Error while fetching batch" });
  }
});

// 4. Fetch Batches Transfered specific to the Logged-in Organization 
router.get("/TransferedBatch", async (req, res) => {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return res.status(401).json({ error: "Unauthorized" });

    const orgdata = await FindOrganization(authUser.id);
    if (!orgdata || !orgdata.data) {
      return res.status(404).json({ error: "Organization not found" });
    }

    // Role-based Access Control
    const allowedRoles = ["manager", "staff", "admin", "owner"]; 
    if (!allowedRoles.includes(orgdata.role)) {
      console.log("Access Denied (TransferedBatch) - Role:", orgdata.role, "Allowed:", allowedRoles);
      return res.status(403).json({ error: "Access denied" });
    }

    const orgId = orgdata.data.id;
    const batches = await FindTransferedBatch(orgId);

    return res.status(200).json({
      success: true,
      count: batches.length,
      data: batches
    });

  } catch (err) {
    console.error("Error fetching OrgBatches:", err);
    return res.status(500).json({ error: "Failed to fetch Organization Batches" });
  }
});

export default router;