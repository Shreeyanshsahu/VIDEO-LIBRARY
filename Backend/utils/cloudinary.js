import { v2 as cloudinary } from "cloudinary";

import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET.substring(0, 5)
});

const uploadOnCloudinary = async (localFilePath) => {
    try {

        if (!fs.existsSync(localFilePath)) {
            throw new Error("File does not exist");
            return null;
        }

        const result = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
            folder: "uploads",
        });
        console.log("File uploaded to Cloudinary:", result.secure_url);
        fs.unlinkSync(localFilePath); 
        // Remove the file from local storage after uploading to  Cloudinary
        return result;
    } catch (error) {
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        //remove the file from local
        // storage after uploading to cloudinary
        console.error("Error uploading to Cloudinary:", error);
        throw error;
    }
};

const deleteFromCloudinary = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        console.log("File deleted from Cloudinary:", result);
        return result;
    } catch (error) {
        console.error("Error deleting from Cloudinary:", error);
        throw error;
    }
};

export { uploadOnCloudinary, deleteFromCloudinary };