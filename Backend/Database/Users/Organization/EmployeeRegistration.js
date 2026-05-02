import supabase from "../../../Middleware/Database/DatabaseConnect.js";

export async function EmployeeRegistration({
    authId,
    orgId,
    email,
    role,
    firstName,
    lastName,
}) {

    if (!authId || !orgId || !email || !role) {
        throw new Error("Missing employee fields");
    }

    const { data, error } = await supabase
        .from("employees")
        .upsert({
            auth_id: authId,
            organization_id: orgId,
            email,
            first_name: firstName,
            last_name: lastName,
            role
        }, { onConflict: "auth_id" })
        .select()
        .single();

    if (error) {
        console.error("Employee Upsert Error:", error);
        throw error;
    }

    return data;
}