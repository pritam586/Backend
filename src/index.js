import dotenv from "dotenv";
import ConnectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
      path: "./.env"
}); 

ConnectDB()
.then(()=>{
     app.listen(process.env.PORT || 9000 , ()=>{
          console.log(`Server is running on port ${process.env.PORT}`);
     });
})
.catch((err)=>{ 
     console.log("MongoDB connection error:", err);
 })



/*
import express from "express";
const app = express();

(async()=>{
     try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_Name}`);
        app.on("error" , (err)=>{
            console.log("Error in connecting to MongoDB");
             throw err;
        })
        console.log("Connected to MongoDB");

            app.listen(process.env.PORT , ()=>{
                console.log(`Server is running on port ${process.env.PORT}`);
            })
     }catch(err){
          console.error(err);
          throw err;
     }
})()

*/