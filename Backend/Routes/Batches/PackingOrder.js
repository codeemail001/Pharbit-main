import express from "express";
import dotenv from "dotenv";
import multer from "multer";
import fs from "fs";
import { parse } from "csv-parse/sync";
import { getAuthUser } from "../../Middleware/Database/AuthUser.js";
import { FindOrganization } from "../../Middleware/Database/AuthUser.js";
import { createPackaging } from "../../Database/Transfer/Packaging/CreatePackagedOrder.js";

dotenv.config();
const router = express.Router();

const upload = multer({ dest: "uploads/" });

router.post("/package-order", upload.single("packaging_csv"), async (req, res) => {
    try {
        const { batchId } = req.body;
        if (!batchId) {
            return res.status(400).json({ error: "batchId is required" });
        }
        /* =========================
           AUTH
        ========================== */
        const authUser = await getAuthUser(req);
        if (!authUser) return res.status(401).json({ error: "Unauthorized" });

        const orgResult = await FindOrganization(authUser.id);
        if (!orgResult.success)
            return res.status(404).json({ error: orgResult.error });

        /* =========================
           Parse CSV Packaging numbers
        ========================== */ 
        let packagingRows = []; // { serial_number, box_code, pallet_code }

        if (req.file) {
            const fileContent = fs.readFileSync(req.file.path);

            const records = parse(fileContent, {
                columns: true,        // first row is header
                skip_empty_lines: true,
                trim: true,
            });

            // validate columns exist
            const required = ["serial_number", "box_code", "pallet_code"];
            if (!records || records.length === 0) {
                fs.unlinkSync(req.file.path);
                return res.status(400).json({ error: "CSV has no data rows" });
            }

            const headers = Object.keys(records[0]);
            const missing = required.filter(col => !headers.includes(col));

            if (missing.length > 0) {
                fs.unlinkSync(req.file.path);
                return res.status(400).json({ error: `CSV missing columns: ${missing.join(", ")}` });
            }

            packagingRows = records.map(row => ({
                serial_number: row.serial_number,
                box_code: row.box_code,
                pallet_code: row.pallet_code,
            }));

            fs.unlinkSync(req.file.path);
        }

        if (packagingRows.length === 0) {
            return res.status(400).json({ error: "CSV is empty" });
        }

        /* =========================
           Add job to queue
        ========================== */
        const result = await createPackaging(batchId, packagingRows);

        if (!result.success) {
            return res.status(500).json({ error: result.error });
        }


        return res.status(200).json({
            success: true,
            message: "Packaging Done",
            data: result.summary,
        });

    } catch (error) {
        console.error("Packaging Error", error);

        res.status(500).json({
            error: "Mint request failed: " + error.message,
        });
    }
});

export default router;