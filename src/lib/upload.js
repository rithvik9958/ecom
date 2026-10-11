import fs from 'fs';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';

// Configure cloudinary only if env vars are present
if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

function sanitizeFileName(fileName) {
  return fileName.replace(/\s+/g, "-");
}

/**
 * Universal file upload utility
 * Automatically chooses between Cloudinary (if configured) or local filesystem.
 * 
 * @param {File|Blob|Buffer} file - The file to upload (from FormData)
 * @param {string} folder - The subfolder name (e.g., 'about', 'categories')
 * @param {string} prefix - Optional prefix for the filename (e.g., 'banner', 'img')
 * @returns {Promise<string>} - The URL of the uploaded file
 */
export async function uploadFile(file, folder = 'uploads', prefix = '') {
  if (!file) return "";

  // Extract buffer and original name
  let buffer;
  let originalName = 'upload.jpg';

  if (file.arrayBuffer && typeof file.arrayBuffer === 'function') {
    const bytes = await file.arrayBuffer();
    buffer = Buffer.from(bytes);
    if (file.name) originalName = file.name;
  } else if (Buffer.isBuffer(file)) {
    buffer = file;
  } else {
    throw new Error("Invalid file format provided to uploadFile");
  }

  const timestamp = Date.now();
  const prefixStr = prefix ? `${prefix}-` : '';
  const sanitizedName = sanitizeFileName(originalName);
  const finalFileName = `${timestamp}-${prefixStr}${sanitizedName}`;

  // Helper to save locally
  const saveLocal = () => {
    const uploadDir = path.join(process.cwd(), `public/uploads/${folder}`);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const filePath = path.join(uploadDir, finalFileName);
    fs.writeFileSync(filePath, buffer);
    return `/uploads/${folder}/${finalFileName}`;
  };

  // Use Cloud Storage if enabled and configured
  if (process.env.USE_CLOUD_STORAGE === 'true' && process.env.CLOUDINARY_CLOUD_NAME) {
    try {
      return await new Promise((resolve) => {
        // Determine if the file is media (image/video) vs raw document
        const isMedia = originalName.toLowerCase().match(/\.(jpe?g|png|gif|webp|svg|bmp|mp4|mov|avi|wmv|webm)$/);
        const isRaw = !isMedia;

        // Remove extension for public_id as Cloudinary adds it automatically based on format (except for raw files)
        const parts = finalFileName.split('.');
        const publicId = (parts.length > 1 && !isRaw) ? parts.slice(0, -1).join('.') : finalFileName;
        
        const uploadStream = cloudinary.uploader.upload_stream(
          { 
            folder: `jindal/${folder}`,
            public_id: publicId,
            resource_type: isRaw ? 'raw' : 'auto'
          },
          (error, result) => {
            if (error) {
              console.warn("Cloudinary Upload Error, seamlessly falling back to local storage:", error.message || error);
              try {
                const localUrl = saveLocal();
                resolve(localUrl);
              } catch (localErr) {
                console.error("Local storage fallback also failed:", localErr);
                resolve("");
              }
            } else {
              resolve(result.secure_url);
            }
          }
        );
        
        uploadStream.end(buffer);
      });
    } catch (err) {
      console.warn("Cloudinary stream initialization failed, falling back to local:", err.message);
      return saveLocal();
    }
  } 
  
  // Use Local Filesystem fallback
  else {
    return saveLocal();
  }
}

/**
 * Helper to check if a value is a valid file for upload from FormData
 */
export function isUploadFile(file) {
    return file && typeof file !== "string" && file.size > 0 && typeof file.arrayBuffer === "function";
}

/**
 * Universal file deletion utility
 * Parses URL and deletes from Cloudinary or local disk.
 */
export async function deleteFile(fileUrl) {
  if (!fileUrl) return;

  if (process.env.USE_CLOUD_STORAGE === 'true' && process.env.CLOUDINARY_CLOUD_NAME) {
    try {
      // Extract resource type (image, raw, video)
      const resourceMatch = fileUrl.match(/\/(image|raw|video)\/upload\//);
      const resourceType = resourceMatch ? resourceMatch[1] : 'image';

      const uploadIndex = fileUrl.indexOf('/upload/');
      if (uploadIndex === -1) return;
      
      let pathAfterUpload = fileUrl.substring(uploadIndex + 8);
      // Remove version string if present (e.g. v123456/)
      if (pathAfterUpload.match(/^v\d+\//)) {
        pathAfterUpload = pathAfterUpload.replace(/^v\d+\//, '');
      }
      
      // Remove file extension
      const publicId = pathAfterUpload.substring(0, pathAfterUpload.lastIndexOf('.')) || pathAfterUpload;
      
      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      console.log(`[Cloudinary] Deleted: ${publicId} (type: ${resourceType})`);
    } catch (err) {
      console.error("[Cloudinary] Deletion error:", err);
    }
  } else {
    try {
      const filePath = path.join(process.cwd(), 'public', fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`[Local Disk] Deleted: ${filePath}`);
      }
    } catch (err) {
      console.error("[Local Disk] Deletion error:", err);
    }
  }
}
