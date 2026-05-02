import { ethers } from "ethers";
import dotenv from "dotenv";
import supabase from "../../../Middleware/Database/DatabaseConnect.js";
import { createShipmentLog } from "./Logs/CreateShipmentLog.js";
import { decrypt } from "../../../Middleware/Database/EncryptDecrypt.js";
import { OrgDetails } from "../../Users/Organization/FindOrganization.js";
import abi from "../../../abi/Pharbit.json" assert { type: "json" };

dotenv.config();

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const RPC_URL = process.env.SEPOLIA_RPC_URL;

export async function redeemShipment(data, orgId) {
    try {
        if (!data.shipment_id) {
            return {
                success: false,
                status: 400,
                error: "Shipment ID is required",
            };
        }

        /* =========================
           1️⃣ Fetch Shipment
        ========================== */
        const { data: shipment, error } = await supabase
            .from("shipments")
            .select("*")
            .eq("id", data.shipment_id)
            .single();

        if (error || !shipment) {
            return { success: false, status: 404, error: "Shipment not found" };
        }

        if (shipment.destination_org_id !== orgId) {
            return {
                success: false,
                status: 403,
                error: "Only destination organization can redeem",
            };
        }

        if (!shipment.is_active) {
            return {
                success: false,
                status: 400,
                error: "Shipment is inactive",
            };
        }

        if (shipment.redeemed) {
            return {
                success: false,
                status: 400,
                error: "Shipment already redeemed",
            };
        }

        const { data: batch, error: batchError } = await supabase
            .from("batches")
            .select("is_active")
            .eq("id", shipment.batch_id)
            .maybeSingle();

        if (batchError) throw batchError;

        if (!batch) {
            return {
                success: false,
                status: 404,
                error: "Batch not found",
            };
        }

        if (!batch.is_active) {
            return {
                success: false,
                status: 409,
                error: "Batch is frozen / recalled. Shipment cannot be redeemed.",
            };
        }

        /* =========================
           2️⃣ Decrypt Wallet
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
           3️⃣ Call Contract redeem()
        ========================== */
        const tx = await contract.redeem(
            BigInt(shipment.blockchain_txn_id)
        );

        const receipt = await tx.wait();

        /* =========================
           4️⃣ Update Shipment
        ========================== */
        const { data: updatedShipment, error: updateError } =
            await supabase
                .from("shipments")
                .update({
                    redeemed: true,
                    escrowed: false,
                    status: "DELIVERED",
                    redeem_tx_hash: receipt.hash,
                    updated_at: new Date(),
                })
                .eq("id", shipment.id)
                .select()
                .single();

        if (updateError) throw updateError;

        /* =========================
           5️⃣ Insert batch_transmitted Record
        ========================== */
        const { error: transmitError } = await supabase
            .from("batch_transmitted")
            .insert([
                {
                    batch_id: shipment.batch_id,
                    shipment_id: shipment.id,
                    organization_id: orgId,
                    amount: shipment.medicines_amount,
                    deposit_tx_hash: shipment.deposit_tx_hash,
                    redeem_tx_hash: receipt.hash,
                },
            ]);

        if (transmitError) throw transmitError;

        /* =========================
           6️⃣ Fetch Org Address
        ========================== */
        const { data: org } = await supabase
            .from("organizations")
            .select("address")
            .eq("id", orgId)
            .single();

        /* =========================
           7️⃣ Create Log
        ========================== */
        await createShipmentLog({
            shipment_id: shipment.id,
            organization_id: orgId,
            action: "REDEEMED",
            location: org?.address || null,
            notes: "Shipment redeemed and batch ownership recorded",
        });

        return {
            success: true,
            status: 200,
            message: "Shipment redeemed successfully",
            blockchain_redeem_tx: receipt.hash,
            data: updatedShipment,
        };

    } catch (err) {
        console.error("Redeem shipment error:", err);
        return {
            success: false,
            status: 500,
            error: err.message || "Internal Server Error",
        };
    }
}