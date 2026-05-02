import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const ALGO = "aes-256-gcm";
const MASTER_KEY = Buffer.from(process.env.MASTER_KEY, "hex");

export function encrypt(text) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGO, MASTER_KEY, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    const tag = cipher.getAuthTag();

    return {
        content: encrypted,
        iv: iv.toString("hex"),
        tag: tag.toString("hex")
    };
}

export function decrypt(encrypted) {
    const decipher = crypto.createDecipheriv(
        ALGO,
        MASTER_KEY,
        Buffer.from(encrypted.iv, "hex")
    );

    decipher.setAuthTag(
        Buffer.from(encrypted.tag, "hex")
    );

    let decrypted = decipher.update(
        encrypted.content,
        "hex",
        "utf8"
    );

    decrypted += decipher.final("utf8");

    return decrypted;
}