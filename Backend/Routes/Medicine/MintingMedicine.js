import express from "express";
import dotenv from "dotenv";
import multer from "multer";
import fs from "fs";
import { parse } from "csv-parse/sync";
import { mintQueue } from "../../Queue/queue.js";

import { FindMeds } from "../../Database/Product/Medicines/Get/FindMedicines.js";
import { getAuthUser, FindOrganization } from "../../Middleware/Database/AuthUser.js";

dotenv.config();
const router = express.Router();

const upload = multer({ dest: "uploads/" });

router.post("/auto-mint", upload.single("serials_csv"), async (req, res) => {
  try {
    const {
      medicineId,
      pricePerToken,
      supply,
      manufacturingDate,
      expiryDate,
      warehouseLocation,
    } = req.body;

    /* =========================
       AUTH
    ========================== */

    const authUser = await getAuthUser(req);
    if (!authUser) return res.status(401).json({ error: "Unauthorized" });

    const orgResult = await FindOrganization(authUser.id);
    if (!orgResult.success)
      return res.status(404).json({ error: orgResult.error });

    const meds = await FindMeds(medicineId);
    if (!meds || !meds.data)
      return res.status(404).json({ error: "Medicine not found" });

    if (meds.data.organization_id !== orgResult.data.id) {
      return res.status(403).json({
        error: "You don't own this medicine record",
      });
    }

    /* =========================
       Parse CSV serial numbers
    ========================== */

    let serialNumbers = [];

    if (req.file) {
      const fileContent = fs.readFileSync(req.file.path);

      const records = parse(fileContent, {
        columns: false,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
      });

      // 🔥 FIX: remove null/empty + safe trim
      serialNumbers = records
        .map(row => row[0])
        .filter(val => val !== null && val !== undefined && val !== "")
        .map(val => String(val).trim());

      fs.unlinkSync(req.file.path);
    }

    /* =========================
       Add job to queue
    ========================== */

    await mintQueue.add("mintMedicine", {
      medicineId,
      pricePerToken,
      supply,
      manufacturingDate,
      expiryDate,
      warehouseLocation,
      orgId: orgResult.data.id,

      // 🔥 FIX: match worker field name
      serial_numbers: serialNumbers,
    });

    return res.status(200).json({
      success: true,
      message: "Mint request queued. Processing in background.",
    });

  } catch (error) {
    console.error("Mint Queue Error:", error);

    res.status(500).json({
      error: "Mint request failed: " + error.message,
    });
  }
});

export default router;