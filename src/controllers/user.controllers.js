import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import {User} from '../models/user.models.js'
import {uploadOnCloudinary,deleteFromCloudinary} from '../utils/cloudinary.js'
import {ApiResponse} from '../utils/ApiResponse.js'
import jwt from "jsonwebtoken";
import mongoose from 'mongoose'

const generateAccessAndRefreshToken = async(userId)=>{
    try{
        const user = await User.findById(userId)
        if (!user) {
            throw new ApiError(404, "User not found");
        }
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave:false})
        return {accessToken,refreshToken}
    }catch(error){
        throw new ApiError(500,"Something went wrong while generating access and refresh tokens")
    }
}

const registerUser = asyncHandler(async(req,res)=>{
    const {fullname, email, username, password} = req.body

    //validation
    if([fullname,username,email,password].some((field)=>field?.trim()==="")){
        throw new ApiError(400,"all fields are required")
    }
    const existedUser = await User.findOne({
        $or:[{username},{email}]
    })
    if(existedUser){
        throw new ApiError(409,"user with email or username already exists")
    }
    console.warn(req.files)
    const avatarLocalPath = req.files?.avatar?.[0]?.path//here multer as middleware is injecting req.file for single file and req.files for multiple files access and it can be accessed here.
    const coverLocalPath = req.files?.coverImage?.[0]?.path
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing")
    }
    // const avatar = await uploadOnCloudinary(avatarLocalPath)
    // let coverImage = ""
    // if(coverLocalPath){
    //     coverImage = await uploadOnCloudinary(coverImage)
    // }
    let avatar;
    try{
        avatar = await uploadOnCloudinary(avatarLocalPath)
        // console.log("uploaded avatar",avatar)
    }catch(error){
        console.log("error uploading avatar",error)
        throw new ApiError(500,"failed to upload avatar")
    }
    let coverImage;
    try{
        coverImage = await uploadOnCloudinary(coverLocalPath)
        // console.log("uploaded coverImage",coverImage)
    }catch(error){
        console.log("error uploading coverImage",error)
        throw new ApiError(500,"failed to upload coverImage")
    }

    try {
        const user = await User.create({
            fullname,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
            email,
            password,
            username: username.toLowerCase()
        })
        const createdUser = await User.findById(user._id).select("-password -refreshToken")
        if(!createdUser){
            throw new ApiError(500,"Something went wrong while registering a user");
        }
        return res.status(201).json(new ApiResponse(200,createdUser,"user registered successfully"))
    } catch (error) {
        console.log("User Creation Failed")
        if(avatar){
            await deleteFromCloudinary(avatar.public_id)
        }
        if(coverImage){
            await deleteFromCloudinary(coverImage.public_id)
        }
        throw new ApiError(500,"Something went wrong while registering a user and images were deleted")
    }
})

const loginUser = asyncHandler(async(req,res)=>{
    const{email,username,password}=req.body
    //validation
    if(!email){
        throw new ApiError(400,"Email is required")
    }
    const user = await User.findOne({
        $or:[{username},{email}]
    })
    if(!user){
        throw new ApiError(404,"user not found")
    }
    //validate password
    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(401,"Invalid Credentials")
    }
    const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id)
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    }
    return res
        .status(201)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",refreshToken,options)
        .json(new ApiResponse(
            200,{user:loggedInUser,accessToken,refreshToken},
            "user logged in successfully"
        ))
})

const logoutUser = asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,//there is no way to access which user is logged in and wants to logout and its done by injecting some information through middlewares so a middleware is defined and used for this purpose
        {
            $set:{
                refreshToken:undefined
            }
        },
        {new: true}//By default, findOneAndUpdate() returns the document as it was before update was applied. If you set new: true, findOneAndUpdate() will instead give you the object after update was applied.
    )
    const options = {
        httpOnly:true,
        secure:process.env.NODE_ENV==="production"
    }
    return res
        .status(200)
        .clearCookie("accessToken",options)
        .clearCookie("refreshToken",options)
        .json(new ApiResponse(200,{},"User logged out successfully"))
})

const refreshAccessToken = asyncHandler(async(req,res)=>{//Login is the initial authentication step requiring user credentials.Refresh Access Token is used to extend a user session without re-authentication by validating the refresh token.
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if(!incomingRefreshToken){
        throw new ApiError(401,"Refresh token is required")
    }
    try{
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
        const user = await User.findById(decodedToken?._id)
        if(!user){
            throw new ApiError(401,"Invalid refresh token")
        }
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401,"Invalid refresh token")
        }
        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production"
        }
        const{accessToken, refreshToken:newRefreshToken} = await generateAccessAndRefreshToken(user._id)
        return res
            .status(200)
            .cookie("accessToken",accessToken,options)
            .cookie("refreshToken",newRefreshToken,options)
            .json(new ApiResponse(200,{accessToken,refreshToken:newRefreshToken},"Access token refreshed successfully"))
    }catch(error){
        throw new ApiError(500,"Something went wrong while refreshing access token");
    }
})

const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword} = req.body
    const user = await User.findById(req.user?._id)
    const isPasswordValid = await user.isPasswordCorrect(oldPassword)
    if(!isPasswordValid){
        throw new ApiError(401,"old password is incorrect")
    }
    user.password = newPassword
    await user.save({validateBeforeSave:false})
    return res.status(200).json(new ApiResponse(200,{},"password changed successfully"))
})

const getCurrentUser = asyncHandler(async(req,res)=>{
    return res.status(200).json(new ApiResponse(200,req.user,"Current user details"))
})

const updateAccountDetails = asyncHandler(async(req,res)=>{
    const {fullname,email} = req.body
    if(!fullname || !email){
        throw new ApiError(400,"Fullname and email are required")
    }
    // Check for duplicate email
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser._id.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "Email already in use by another account");
    }
    const user = await User.findByIdAndUpdate(req.user?._id,{$set:{fullname,email}},{new:true}).select("-password -refreshToken")
    return res.status(200).json(new ApiResponse(200,user,"Account details updated Successfully"))
})

const updateUserAvatar = asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.file?.path//request comes with new avatar's local path
    if(!avatarLocalPath){
        throw new ApiError(400,"File is required")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)//that image from local path is uploaded on cloudinary
    if(!avatar.url){
        throw new ApiError(500,"Something went wrong while uploading avatar")
    }
    const user = await User.findByIdAndUpdate(req.user?._id,{$set:{avatar:avatar.url}},{new:true}).select("-password -refreshToken")//here database is updated for that particular user 
    res.status(200).json(new ApiResponse(200,user,"Avatar updated successfully"))
})

const updateUserCoverImage = asyncHandler(async(req,res)=>{
    const coverLocalPath = req.file?.path
    if(!coverLocalPath){
        throw new ApiError(401,"file is required")
    }
    const coverImage = await uploadOnCloudinary(coverLocalPath)
    if(!coverImage.url){
        throw new ApiError(500,"Something went wrong while uploading cover image")
    }
    const user = await User.findByIdAndUpdate(req.user?._id,{$set:{coverImage:coverImage.url}},{new:true}).select("-password -refreshToken")
    res.status(200).json(new ApiResponse(200,user,"Cover Image updated successfully"))
})

const getUserChannelProfile = asyncHandler(async(req,res)=>{
    const {username} = req.params
    if(!username?.trim()){
        throw new ApiError(400,"Username is required")
    }
    const channel = await User.aggregate(
        [
            {
                $match:{//matches the username of the user that requested the profile of channel with username in the database
                    username:username?.toLowerCase()
                }
            },
            {
                $lookup:{//similar to join queries in sql and displays result from two tables based on a common column in both tables
                    from: "subscriptions",
                    localField: "_id",
                    foreignField:"channel",
                    as:"subscribers"
                }
            },
            {
                $lookup:{
                    from: "subscriptions",
                    localField: "_id",
                    foreignField:"subscribers",
                    as:"subscribedTo"
                }
            },
            {
                $addFields:{
                    subscribersCount:{
                        $size:"$subscribers"
                    },
                    channelsSubscribedToCount:{
                        $size:"$subscribedTo"
                    },
                    isSubscribed:{
                        $cond:{
                            if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                            then:true,
                            else:false
                        }
                    }
                }
            },
            {
                //project or select only the necessary data
                $project:{
                    fullname:1,
                    username:1,
                    avatar:1,
                    subscribersCount:1,
                    channelsSubscribedToCount:1,
                    isSubscribed:1,
                    coverImage:1,
                    email:1
                }
            }
        ]
    )
    if(!channel?.length){
        throw new ApiError(404,"Channel not Found")
    }

    return res.status(200).json(new ApiResponse(200,channel[0],"Channel profile fetched successfully"))
})

const getWatchHistory = asyncHandler(async(req,res)=>{
    const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchzhistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullname:1,
                                        username:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res.status(200).json(new ApiResponse(200,user[0],"Watch history fetched successfully"))
})


export{registerUser,loginUser,refreshAccessToken,logoutUser,changeCurrentPassword,getCurrentUser,updateAccountDetails,updateUserAvatar,updateUserCoverImage , getUserChannelProfile, getWatchHistory}


//EXPLANATION FOR ACCESS TOKEN & REFRESH TOKEN
// we have a user and a server, now server generates both these tokens and store them in the database(only refresh token is tored in db) associated to user object of that particular user now these tokens are also sent to the user , access token is short lived like 15mins but refresh token is long lived like 1day, now if we want to disallow someone to login we can delete refresh token from the database so when user tries to login there wont be a refresh token in the db to compare to,
//now with each request and response the access token travels with it and when access token expires, we have to create a new route that is responsible to generate both tokens now when access token expires user can send a request to that route alongwith the refresh token and it can be regenerated.

