import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.models.js"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = "createdAt", sortType = "desc", userId } = req.query;

    // Build the filter object
    const filter = {};
    if (query) {
        filter.title = { $regex: query, $options: "i" }; // Case-insensitive search on the `title`
    }
    if (userId) {
        filter.userId = userId; // Filter by specific user's videos
    }

    // Calculate pagination values
    const skip = (page - 1) * limit;

    try {
        // Fetch videos with filters, sorting, and pagination
        const videos = await Video.find(filter)
            .sort({ [sortBy]: sortType === "desc" ? -1 : 1 }) // Sorting by the specified field and order
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count of matching videos
        const totalVideos = await Video.countDocuments(filter);

        // Prepare the response with metadata
        return res.status(200).json({
            success: true,
            data: {
                videos,
                totalVideos,
                totalPages: Math.ceil(totalVideos / limit),
                currentPage: parseInt(page),
            },
            message: "Videos fetched successfully",
        });
    } catch (error) {
        throw new ApiError(500, "Something went wrong while fetching videos");
    }
});

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    // Validate input
    if (!title || !description || !req.files?.videoFile) {
        throw new ApiError(400, "Title, description, and video file are required");
    }

    console.warn(req.files)
    const videoLocalPath = req.files?.videoFile?.[0]?.path//here multer as middleware is injecting req.file for single file and req.files for multiple files access and it can be accessed here.
    const thumbLocalPath = req.files?.thumbnail?.[0]?.path

    if (!videoLocalPath || !thumbLocalPath) {
        throw new ApiError(400, "Video and thumbnail files are required");
    }

    // Upload video and thumbnail to Cloudinary
    try {
        // Step 1: Upload video file to Cloudinary
        const videoResult = await uploadOnCloudinary(videoLocalPath)

        // Step 2: Upload thumbnail to Cloudinary (if provided)
        let thumbnailUrl = "";
        if (req.files?.thumbnail) {
            const thumbnailResult = await uploadOnCloudinary(thumbLocalPath)
            thumbnailUrl = thumbnailResult.secure_url;
        }

        // Step 3: Create the video document in the database
        const newVideo = await Video.create({
            videoFile: videoResult.secure_url,
            thumbnail: thumbnailUrl || videoResult.secure_url, // Fallback to video URL if no thumbnail
            title,
            description,
            duration: videoResult.duration || 0,
            owner: req.user._id,
        });

        // Step 4: Send response
        return res.status(201).json(
            new ApiResponse(201, newVideo, "Video published successfully")
        );
    } catch (error) {
        throw new ApiError(500, "Something went wrong while publishing the video");
    }
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    // Validate videoId
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID format");
    }
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")      
    }
    return res.status(200).json(new ApiResponse(200, video, "Video fetched successfully"))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params; // Extract the video ID from the route params
    const { title, description } = req.body; // Extract the updated title and description from the request body

    // Check if the video ID is provided
    if (!videoId) {
        throw new ApiError(400, "Video ID is required");
    }

    // Check if title or description is provided
    if (!title && !description && !req.file) {
        throw new ApiError(400, "No update data provided");
    }

    try {
        // Find the video by ID
        const video = await Video.findById(videoId);
        if (!video) {
            throw new ApiError(404, "Video not found");
        }

        // Update video fields if they are provided
        if (title) video.title = title;
        if (description) video.description = description;

        // Handle thumbnail update if a new file is uploaded
        if (req.file) {
            console.warn(req.files)
            const thumbLocalPath = req.file?.thumbnail?.[0]?.path
            let thumbnailUrl = "";
            if (req.file?.thumbnail) {
                const thumbnailResult = await uploadOnCloudinary(thumbLocalPath)
                thumbnailUrl = thumbnailResult.secure_url;
            }
        }

        // Save the updated video
        const updatedVideo = await video.save();

        // Send the response
        return res.status(200).json(
            new ApiResponse(200, updatedVideo, "Video details updated successfully")
        );
    } catch (error) {
        throw new ApiError(500, error.message || "An error occurred while updating the video");
    }
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if (!videoId) {
        throw new ApiError(400, "Video ID is required");
    }
    try{
        const video = await Video.findById(videoId)
        if (!video) {
            throw new ApiError(404, "Video not found")
        }
        await Video.deleteOne({ _id: videoId });
        return res.status(200).json(new ApiResponse(200, video, "Video deleted successfully"))
    }catch(error){
        throw new ApiError(500, error.message || "An error occurred while deleting the video")
    }

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!videoId) {
        throw new ApiError(400, "Video ID is required");
    }
    try {
        const video = await Video.findById(videoId)
        if (!video) {
            throw new ApiError(404, "Video not found")
        }
        video.isPublished = !video.isPublished
        const updatedVideo = await video.save()
        return res.status(200).json(new ApiResponse(200, updatedVideo, "Video status updated successfully"))
    }catch(error){
        throw new ApiError(500, error.message || "An error occurred while updating the video status")
    }
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}