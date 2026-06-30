import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
console.log("DB_NAME is:", DB_NAME);
const connectDB=async()=>{
    try{
        const connectionInstance = await mongoose.connect(`${process.env.MONGO_DB_URL}/${DB_NAME}`)
        console.log(`\nMongo connected !! DB HOST:${connectionInstance.connection.host}`)
    }catch(error){
        console.log("MONGODB CONNECTION ERROR",error)
        process.exit(1)
    }
}

export default connectDB;