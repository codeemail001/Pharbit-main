import supabase from "./DatabaseConnect.js";

export const getAuthUser = async (req) => {
  const authHeader = req.headers.authorization;
  const token = (authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null) || req.cookies?.Pharbit_Token;
  
  console.log("Auth Check - Token Present:", !!token);
  if (!token) {
    console.log("No token found. Cookies:", Object.keys(req.cookies || {}));
    throw new Error("Unauthorized");
  }
  const { data, error } = await supabase.auth.getUser(token);
  if (error) throw error;
  return data.user;
};


export const FindUser = async (userId) => {
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("auth_id", userId)
    .single();

  if (error) throw error;
  console.log(data);
  return data;
};


export const FindRole = async (userId) => {
  const { data, error } = await supabase
    .from("employees")
    .select("role")
    .eq("auth_id", userId)
    .order("created_at", { ascending: false }); // Get the most recent role first

  if (error) {
    console.error("FindRole DB Error:", error);
    throw error;
  }

  if (!data || data.length === 0) {
    console.warn("FindRole: No role found for user", userId);
    return null;
  }

  // If multiple roles exist, log a warning but continue with the most recent one
  if (data.length > 1) {
    console.warn(`FindRole: Multiple roles (${data.length}) found for user ${userId}. Using most recent: ${data[0].role}`);
  }

  return data[0]; // Return the first (most recent) result
};


export const FindOrganization = async (userId) => {
  try {
    const { data: employee, error: empError } = await supabase
      .from("employees")
      .select("organization_id , role ")
      .eq("auth_id", userId)
      .single();
    console.log(employee);
    if (empError || !employee) {
      return {
        success: false,
        error: "User not linked to any organization"
      };
    }

    const { data: organization, error: orgError } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", employee.organization_id)
      .single();

    if (orgError || !organization) {
      return {
        success: false,
        error: "Organization details not found"
      };
    }

    return {
      success: true,
      data: organization,
      role: employee.role
    };
  } catch (err) {
    console.error("FindOrganization unexpected error:", err);
    return {
      success: false,
      error: "Internal error fetching organization"
    };
  }
};