import express from "express";
import dotenv from "dotenv";
import { FindOrganization, getAuthUser } from "../../Middleware/Database/AuthUser.js";
import { updateShipmentOnScan } from "../../Database/Transfer/Shipment/UpdateShipment.js";



dotenv.config();
const router = express.Router();

router.post("/scan-shipment", async (req, res) => {
    try {
        const { tracking_code } = req.body;

        if (!tracking_code) {
            return res.status(400).json({
                success: false,
                error: "Tracking code is required",
            });
        }
        /* =========================
           1️⃣ AUTH
        ========================== */
        const authUser = await getAuthUser(req);
        if (!authUser) {
            return res.status(401).json({
                success: false,
                error: "Unauthorized",
            });
        }
        const orgResult = await FindOrganization(authUser.id);
        if (!orgResult.success) {
            return res.status(404).json({
                success: false,
                error: orgResult.error,
            });
        }

        const orgId = orgResult.data.id;

        /* =========================
           2️⃣ Call Update Function
        ========================== */
        const result = await updateShipmentOnScan(tracking_code, orgId);

        if (!result.success) {
            return res.status(result.status || 400).json({
                success: false,
                error: result.error,
            });
        }

        /* =========================
           3️⃣ Success Response
        ========================== */
        return res.status(200).json({
            success: true,
            message: result.message,
            action: result.action, // RECEIVED or REDEEM
            shipment: result.shipment || result.data,
        });

    } catch (error) {
        console.error("Scan Shipment Route Error:", error);
        return res.status(500).json({
            success: false,
            error: "Server error: " + error.message,
        });
    }
});

export default router;