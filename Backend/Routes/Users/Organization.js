import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import { createOrgWallet } from "../../Database/Users/Organization/AddOrganization.js";
import { getAllOrganizations } from "../../Database/Users/Organization/FindOrganization.js";

import { getAuthUser } from "../../Middleware/Database/AuthUser.js";
import { EmployeeRegistration } from "../../Database/Users/Organization/EmployeeRegistration.js";

dotenv.config();
const router = express.Router();
router.use(express.json());

router.post("/organization", async (req, res) => {
    try {
        const authUser = await getAuthUser(req);
        if (!authUser) {
            return res.status(401).json({ error: "Authentication required to register a business" });
        }

        const {
            registrationId,
            organizationName,
            type
        } = req.body;

        if (!registrationId || !organizationName || !type) {
            return res.status(400).json({
                message: "registrationId, organizationName and type are required"
            });
        }

        // 1. Create Organization & Wallet
        const org = await createOrgWallet({
            registrationId,
            organizationName,
            type
        });

        // 2. Link the current user as the 'owner'
        try {
            await EmployeeRegistration({
                authId: authUser.id,
                orgId: org.id,
                email: authUser.email,
                role: "owner",
                firstName: authUser.user_metadata?.first_name || "Admin",
                lastName: authUser.user_metadata?.last_name || "User"
            });
        } catch (linkErr) {
            // If user is already linked elsewhere, throw that error
            if (linkErr.message === "Employee already exists") {
                throw new Error("Your account is already linked to an organization.");
            }
            throw linkErr;
        }

        return res.status(201).json({
            message: org.isExisting 
                ? "Account linked to existing organization successfully" 
                : "Organization registered and linked successfully",
            organization: {
                id: org.id,
                name: org.name,
                registrationId,
                type,
                walletAddress: org.address
            }
        });

    } catch (err) {
        console.error("Org signup error:", err);
        return res.status(err.message === "Unauthorized" ? 401 : 400).json({
            error: err.message
        });
    }
});

router.get("/organization", async (req, res) => {
    try {
        const organizations = await getAllOrganizations();
        return res.status(200).json(organizations);

    } catch (err) {
        // This will catch both Supabase errors and connection issues
        console.error("Fetch organization error:", err);
        return res.status(400).json({
            error: err.message
        });
    }
});




export default router;