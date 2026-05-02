import { Wallet } from "ethers";
import { encrypt } from "../../../Middleware/Database/EncryptDecrypt.js";
import supabase from "../../../Middleware/Database/DatabaseConnect.js";


// ===============================
// CREATE ORG + WALLET (SAFE)
// ===============================

export async function createOrgWallet(data) {

    // 1️⃣ Check if organization already exists
    const { data: existingOrg, error: fetchError } = await supabase
        .from("organizations")
        .select("id, wallet_address")
        .eq("registration_id", data.registrationId) // ✅ FIXED
        .single();

    if (fetchError && fetchError.code !== "PGRST116") {
        throw fetchError;
    }

    // If org exists
    if (existingOrg) {
        return {
            id: existingOrg.id,
            name: data.organizationName,
            address: existingOrg.wallet_address,
            isExisting: true
        };
    }

    // 2️⃣ Generate wallet
    const wallet = Wallet.createRandom();

    // 3️⃣ Encrypt private key
    const encrypted = encrypt(wallet.privateKey);

    // 4️⃣ Insert into DB
    const { data: newOrg, error } = await supabase
        .from("organizations")
        .insert({
            registration_id: data.registrationId, // ✅ FIXED
            name: data.organizationName,
            type: data.type,

            wallet_address: wallet.address,
            wallet_encrypted: encrypted.content,
            wallet_iv: encrypted.iv,
            wallet_tag: encrypted.tag
        })
        .select()
        .single();

    if (error) throw error;

    // 5️⃣ Return (DEV ONLY)
    return {
        id: newOrg.id,
        name: newOrg.name,
        address: wallet.address,

        privateKey: wallet.privateKey
    };
}