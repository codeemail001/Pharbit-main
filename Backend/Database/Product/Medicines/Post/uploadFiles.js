import supabase from "../../../../Middleware/Database/DatabaseConnect.js";

/**
 * Uploads files from multer to Supabase Storage
 * @param {Array} files - multer files array
 * @param {String} bucket - supabase bucket name
 * @returns {Array} public URLs
 */
export const uploadFiles = async (files, bucket) => {
  if (!files || !files.length) return [];

  const uploadedUrls = [];

  for (const file of files) {
    const filePath = `${Date.now()}-${file.originalname}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (error) throw error;

    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    uploadedUrls.push(data.publicUrl);
  }

  return uploadedUrls;
};