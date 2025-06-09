import { Like } from "../models/like.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user.id; // Assuming user authentication middleware adds `req.user`

    if (!videoId) {
        throw new ApiError(400, "Video ID is required");
    }

    try {
        // Check if the like already exists
        const existingLike = await Like.findOne({ video: videoId, likedBy: userId });

        if (existingLike) {
            // If like exists, remove it (toggle off)
            await Like.findByIdAndDelete(existingLike._id);
            return res.status(200).json(new ApiResponse(200, null, "Like removed successfully"));
        } else {
            // If like does not exist, create a new like (toggle on)
            const newLike = await Like.create({ video: videoId, likedBy: userId });
            return res.status(201).json(new ApiResponse(201, newLike, "Video liked successfully"));
        }
    } catch (error) {
        throw new ApiError(500, error.message || "An error occurred while toggling the like");
    }
});


const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user.id; // Assuming user authentication middleware adds `req.user`

    if (!commentId) {
        throw new ApiError(400, "Comment ID is required");
    }

    try {
        // Check if the like already exists
        const existingLike = await Like.findOne({ comment: commentId, likedBy: userId });

        if (existingLike) {
            // If like exists, remove it (toggle off)
            await Like.findByIdAndDelete(existingLike._id);
            return res.status(200).json(new ApiResponse(200, null, "Like removed from comment successfully"));
        } else {
            // If like does not exist, create a new like (toggle on)
            const newLike = await Like.create({ comment: commentId, likedBy: userId });
            return res.status(201).json(new ApiResponse(201, newLike, "Comment liked successfully"));
        }
    } catch (error) {
        throw new ApiError(500, error.message || "An error occurred while toggling the like on comment");
    }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const userId = req.user.id; // Assuming user authentication middleware adds `req.user`

    if (!tweetId) {
        throw new ApiError(400, "Tweet ID is required");
    }

    try {
        // Check if the like already exists
        const existingLike = await Like.findOne({ tweet: tweetId, likedBy: userId });

        if (existingLike) {
            // If like exists, remove it (toggle off)
            await Like.findByIdAndDelete(existingLike._id);
            return res.status(200).json(new ApiResponse(200, null, "Like removed from tweet successfully"));
        } else {
            // If like does not exist, create a new like (toggle on)
            const newLike = await Like.create({ tweet: tweetId, likedBy: userId });
            return res.status(201).json(new ApiResponse(201, newLike, "Tweet liked successfully"));
        }
    } catch (error) {
        throw new ApiError(500, error.message || "An error occurred while toggling the like on tweet");
    }
});


const getLikedVideos = asyncHandler(async (req, res) => {
    const userId = req.user.id; // Assuming authentication middleware provides `req.user`

    try {
        // Find all liked videos by the user
        const likedVideos = await Like.find({ likedBy: userId, video: { $ne: null } }) // Ensures only video likes are fetched
            .populate({
                path: "video",
                select: "title thumbnailUrl createdAt" // Select only necessary fields
            });

        return res.status(200).json(new ApiResponse(200, likedVideos, "Liked videos retrieved successfully"));
    } catch (error) {
        throw new ApiError(500, error.message || "An error occurred while retrieving liked videos");
    }
});


export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}