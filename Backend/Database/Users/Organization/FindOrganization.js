import supabase from "../../../Middleware/Database/DatabaseConnect.js";

export const OrgDetails = async (OrgId) => {
  if (!OrgId) {
    throw new Error("Auth ID is required");
  }
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", OrgId)
    .single();

  if (error) {
    throw error;
  }

  // Employee found
  return data
};

export const getAllOrganizations = async () => {
  const { data, error } = await supabase
    .from("organizations")
    .select("id ,  name, wallet_address ")
    .order("name", { ascending: true })
  if (error) {
    console.error("Error fetching organizations:", error.message);
    throw new Error(`Failed to fetch organizations: ${error.message}`);
  }

  return data;
};