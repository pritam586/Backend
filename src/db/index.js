import mongoose from "mongoose";
import { DB_Name } from "../constants.js";

export const ConnectDB = async ()=>{
    try {
       const connectionInstance = await mongoose.connect(
         `${process.env.MONGODB_URI}/${DB_Name}`
       );

        console.log(
          `MongoDB connected! HOST: ${connectionInstance.connection.host}`
        );

    } catch (error) {
        console.log("Mongo DB connection error:", error);
        process.exit(1);
    }
};

export default ConnectDB;