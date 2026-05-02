import supabase from "../../../Middleware/Database/DatabaseConnect.js";

export async function createAuthUser(
  email,
  password,
  firstName,
  lastName
) {

  if (!email || !password || !firstName || !lastName) {
    throw new Error("Missing user fields");
  }

  const fullName = `${firstName} ${lastName}`;

  const { data, error } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,

      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        full_name: fullName,
        name: fullName
      }
    });

  if (error) {
    console.error("FULL ERROR:", JSON.stringify(error, null, 2));
    throw error;
  }

  return data.user;
}