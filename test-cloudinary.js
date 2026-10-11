require('dotenv').config();
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadStream = cloudinary.uploader.upload_stream(
  {
    folder: `jindal/test`,
    public_id: 'test-image',
    resource_type: 'auto'
  },
  (error, result) => {
    if (error) {
      console.error("Cloudinary Upload Error:", error);
    } else {
      console.log("Success:", result.secure_url);
    }
  }
);

uploadStream.end(Buffer.from("dummy data for image testing", "utf-8"));
