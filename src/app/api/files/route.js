import { revalidatePath } from "next/cache";
export const dynamic = 'force-dynamic';
import fs from 'fs';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';

if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Helper to recursively list local files
function getAllLocalFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);
    
    arrayOfFiles = arrayOfFiles || [];
  
    files.forEach(function(file) {
      if (fs.statSync(dirPath + "/" + file).isDirectory()) {
        arrayOfFiles = getAllLocalFiles(dirPath + "/" + file, arrayOfFiles);
      } else {
        // Exclude hidden files or system files if needed
        if (!file.startsWith('.')) {
            arrayOfFiles.push(path.join(dirPath, "/", file));
        }
      }
    });
  
    return arrayOfFiles;
}

import { verifyToken } from "@/app/lib/auth";

export async function GET(request) {
    try {
        await verifyToken(request);
        const isCloudStorage = process.env.USE_CLOUD_STORAGE === 'true' && process.env.CLOUDINARY_CLOUD_NAME;

        if (isCloudStorage) {
            // Fetch from Cloudinary
            const result = await cloudinary.api.resources({
                type: 'upload',
                prefix: 'jindal/', // Only fetch files within the jindal folder
                max_results: 500,
            });

            const files = result.resources.map(res => ({
                id: res.public_id,
                url: res.secure_url,
                format: res.format,
                sizeBytes: res.bytes,
                createdAt: res.created_at,
                source: 'cloudinary'
            }));

            return Response.json({ data: files, source: 'cloudinary' });
        } else {
            // Fetch from Local Filesystem (public/uploads)
            const uploadDir = path.join(process.cwd(), 'public/uploads');
            
            if (!fs.existsSync(uploadDir)) {
                return Response.json({ data: [], source: 'local' });
            }

            const localFilesPaths = getAllLocalFiles(uploadDir);
            
            const files = localFilesPaths.map(filePath => {
                const stat = fs.statSync(filePath);
                // Convert absolute path to public URL path
                const relativePath = filePath.replace(path.join(process.cwd(), 'public'), '').replace(/\\/g, '/');
                
                return {
                    id: relativePath,
                    url: relativePath,
                    format: path.extname(filePath).replace('.', ''),
                    sizeBytes: stat.size,
                    createdAt: stat.birthtime,
                    source: 'local'
                };
            });

            // Sort by newest first
            files.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            return Response.json({ data: files, source: 'local' });
        }
    } catch (error) {
        console.error("Failed to fetch files:", error);
        return Response.json({ message: "Failed to fetch files", error: error.message }, { status: 500 });
    }
}

import { deleteFile } from "@/lib/upload";

export async function DELETE(request) {
    try {
        await verifyToken(request);
        const { searchParams } = new URL(request.url);
        const fileUrl = searchParams.get('url');

        if (!fileUrl) {
            return Response.json({ message: "File URL is required" }, { status: 400 });
        }

        await deleteFile(fileUrl);
        
        
    // On-Demand Revalidation
    revalidatePath('/', 'layout');
    return Response.json({ message: "File deleted successfully" });
    } catch (error) {
        console.error("Failed to delete file:", error);
        return Response.json({ message: "Failed to delete file", error: error.message }, { status: 500 });
    }
}
