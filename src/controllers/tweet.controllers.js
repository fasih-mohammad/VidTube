import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.models.js"
import { User } from "../models/user.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { content } = req.body;
    if (!content || content.trim() === "") {
        throw new ApiError(400, "Comment content is required");
    }
    try {
        const tweet = await Tweet.create({
            owner: req.user._id,
            content
        })
        return res.status(201).json(new ApiResponse(201, tweet, "Tweet Created Successfully"));
    } catch (error) {
        throw new ApiError(500, error.message || "An error occurred while adding the tweet");
    }
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const { userId } = req.params;
    if (!isValidObjectId(userId)) {
        throw new ApiError("Invalid userId");
    }
    try {
        const tweets = await Tweet.find({ owner: userId }).sort({ createdAt: -1 });
        return res.status(201).json(new ApiResponse(201, tweets, "Tweets fetched successfully"))
    } catch (error) {
        throw new ApiError(500, error.message || "An error occurred while fetching tweets");
    }
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { tweetId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    // Validate tweetId
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID");
    }

    try {

        // Find the tweet
        const tweet = await Tweet.findById(tweetId);
        if (!tweet) {
            throw new ApiError(404, "Tweet not found");
        }

        // Check if the logged-in user is the owner of the tweet
        if (tweet.owner.toString() !== userId.toString()) {
            throw new ApiError(403, "You are not authorized to update this tweet");
        }

        // Update tweet content
        tweet.content = content || tweet.content;
        await tweet.save();

        res.status(200).json(new ApiResponse(200, tweet, "Tweet updated successfully"));
    }catch (error) {
        throw new ApiError(500, error.message || "An error occurred while updating tweet");
    }
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} = req.params;
    const userId = req.user._id;

    // Validate tweetId
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID");
    }

    const tweet = await Tweet.findById(tweetId);
    if(!tweet){
        throw new ApiError(404,"tweet Not found")
    }
   
    if (tweet.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You are not authorized to update this tweet");
    }

    await Tweet.findByIdAndDelete(tweetId);
    res.status(200).json(new ApiResponse(200, {}, "Tweet deleted successfully"));
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}