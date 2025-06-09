import mongoose from "mongoose"
import {Video} from "../models/video.models.js"
import {Subscription} from "../models/subscription.models.js"
import {Like} from "../models/like.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // Total videos uploaded by the user
    const totalVideos = await Video.countDocuments({ owner: userId });

    // Total views across all videos
    const videos = await Video.find({ owner: userId }, "views");
    const totalViews = videos.reduce((sum, video) => sum + (video.views || 0), 0);

    // Total subscribers
    const totalSubscribers = await Subscription.countDocuments({ channel: userId });

    // Total likes on the user's videos
    const videoIds = videos.map(video => video._id);
    const totalLikes = await Like.countDocuments({ video: { $in: videoIds } });

    const stats = {
        totalVideos,
        totalViews,
        totalSubscribers,
        totalLikes
    };

    res.status(200).json(new ApiResponse(200, stats, "Channel stats retrieved successfully"));
});

const getChannelVideos = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const videos = await Video.find({ owner: userId })
        .select("title thumbnailUrl views createdAt")
        .sort({ createdAt: -1 });

    res.status(200).json(new ApiResponse(200, videos, "Channel videos retrieved successfully"));
});

export {
    getChannelStats, 
    getChannelVideos
    } 