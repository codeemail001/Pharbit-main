import supabase from "../../../Middleware/Database/DatabaseConnect.js";
import { v4 as uuidv4 } from "uuid";

export async function InviteEmployee(data, employee) {

    const { email, role, firstName, lastName } = data;
    if (!email || !role) {
        throw new Error("Email and role are required");
    }

    const { data: existingEmp, error: fetchError } = await supabase
        .from("employees")
        .select("id")
        .eq("email", email)
        .single();

    if (fetchError && fetchError.code !== "PGRST116") {
        throw fetchError;
    }

    if (existingEmp) {
        throw new Error("Employee already exists");
    }

    const token = uuidv4();

    const expires = new Date();
    expires.setDate(expires.getDate() + 2);

    const { error } = await supabase
        .from("org_invites")
        .insert({
            organization_id: employee.organization_id,
            invited_by: employee.id,
            first_name: firstName,
            last_name: lastName,
            email: email,
            role: role,
            token: token,
            expires_at: expires
        });

    if (error) throw error;

    const link = `http://localhost:5173/?token=${token}`;

    console.log("INVITE LINK:", link);

    return {
        email,
        role,
        link
    };
}


export async function findInviteByToken(token) {
    if (!token) {
        throw new Error("Token required");
    }
    const { data, error } = await supabase
        .from("org_invites")
        .select("*")
        .eq("token", token)
        .single();

    if (error || !data) {
        throw new Error("Invalid invite");
    }

    if (data.used) {
        throw new Error("Invite already used");
    }

    if (new Date(data.expires_at) < new Date()) {
        throw new Error("Invite expired");
    }

    return data;
}


export async function markInviteUsed(inviteId) {

    if (!inviteId) {
        throw new Error("Invite ID required");
    }

    const { error } = await supabase
        .from("org_invites")
        .delete()
        .eq("id", inviteId);

    if (error) throw error;
}