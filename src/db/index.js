//when connebcting with databases 2 things to keep in mind:
//1. always wrap the connection block in a try catch statement
//2.database is always in another continent so connection takes time hence async await must be used

import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";


const connectDB = async()=>{
    try{
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`\n MongoDB connected! DB host: ${connectionInstance.connection.host}`)
    }catch(error){
        console.log("MongoDb connection error :",error);
        process.exit(1);
    }
}
export default connectDB;