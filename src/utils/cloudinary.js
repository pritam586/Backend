import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret:  process.env.CLOUDINARY_API_SECRET 
});

const uploadOncloudinary = async (localpath) =>{
    try {
        if(!localpath) return null
        // upload on file on cloudinary
        const response =  await cloudinary.uploader.upload(localpath,{
            resource_type:'auto'
        })
        // file has been uploaded successfully
        console.log("FIle is uploaded on cloudinary", response.url )
        return response
    } catch (error) {
        fs.unlinkSync(localpath) // Remove the locally saved temporary file as the upload operation got failed
        
        return null
    }
}


export {uploadOncloudinary}


