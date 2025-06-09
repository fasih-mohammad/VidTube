import jwt from "jsonwebtoken"
import { User } from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {asyncHandler} from "../utils/asyncHandler.js"

export const verifyJWT = asyncHandler(async(req, _,next)=>
{
    const token = req.cookies.accessToken || req.header("Authorization")?.replace("Bearer ","")
    if(!token){
        throw new ApiError(401,"Unauthorized")
    }
    try{
        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
        // Ensure the decodedToken contains _id
        if (!decodedToken?._id) {
            throw new ApiError(401, "Unauthorized: Invalid token payload");
        }
        // Find the user in the database
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
        if(!user){
            throw new ApiError(401,"Unauthorized")
        }
        // Attach user to request object
        req.user = user
        next()
    }catch(error){
        throw new ApiError(401,error?.message || "Invalid access token")
    }
})
// This middleware main purpose is to inject the user's information into user object of req.user and then pass that information using next() to user.controllers.js where it will be used to implement logout functionality