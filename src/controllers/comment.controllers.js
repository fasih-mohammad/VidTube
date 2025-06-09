import mongoose from "mongoose"
import { Comment } from "../models/comment.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Video } from "../models/video.models.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

    // Validate videoId
    if (!videoId) {
        throw new ApiError(400, 'Video ID is required');
    }

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    // Define the aggregation pipeline
    const { ObjectId } = mongoose.Types;
    const pipeline = [
        { $match: { video: new mongoose.Types.ObjectId(videoId) } }, // Match comments for the specific video
        {
            $lookup: {
                from: 'users', // Collection name in MongoDB
                localField: 'owner',
                foreignField: '_id',
                as: 'ownerDetails'
            }
        },
        { $unwind: '$ownerDetails' }, // Unwind the ownerDetails array//In MongoDB's aggregation framework, the $unwind stage is used to deconstruct an array field from the input documents, outputting a separate document for each element of the array. In this context, after performing a $lookup to join the Comment documents with the User collection, the ownerDetails field becomes an array (even if it contains only a single user document). Applying $unwind to ownerDetails transforms this array into individual documents, simplifying access to the nested fields in subsequent stages of the pipeline.
        {
            $project: { //project is like select statement in sql to select specific fields
                content: 1,
                createdAt: 1,
                'ownerDetails.username': 1,//ownerDetails was unwind or destructured and now we can access its fields
                'ownerDetails.email': 1 // Include other necessary fields
            }
        }
    ];

    // Set pagination options//Here, options is an object that defines the pagination parameters for the query:page: Specifies the current page number to retrieve.limit: Determines the maximum number of documents to return per page.These settings facilitate dividing the dataset into manageable chunks, enhancing performance and user experience when dealing with large collections.
    const options = {
        page: pageNumber,
        limit: limitNumber
    };

    // Execute the aggregation with pagination
    const result = await Comment.aggregatePaginate(Comment.aggregate(pipeline), options);//This line executes the aggregation pipeline with pagination by utilizing the mongoose-aggregate-paginate-v2 plugin: Comment.aggregate(pipeline): Initiates the aggregation framework with the defined pipeline, which includes stages like $match, $lookup, $unwind, and $project. Comment.aggregatePaginate(...): Applies pagination to the aggregation results based on the specified options. This method is provided by the mongoose-aggregate-paginate-v2 plugin, which must be properly integrated into your Mongoose schema to function correctly.The await keyword ensures that the function waits for the asynchronous operation to complete before proceeding, allowing for proper handling of the paginated results.

    // Prepare the response This segment constructs a response object containing: totalDocs: The total number of documents matching the query criteria. totalPages: The total number of pages available based on the limit. currentPage: The current page number being retrieved. comments: An array of comment documents for the current page. This structured response provides clients with comprehensive information about the paginated data, enabling effective navigation through the dataset.
    const response = {
        totalDocs: result.totalDocs,
        totalPages: result.totalPages,
        currentPage: result.page,
        comments: result.docs
    };

    // Send the response
    res.status(200).json(new ApiResponse(200, response, 'Comments retrieved successfully'));
});

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { videoId } = req.params;
    const { content } = req.body;

    // Validate inputs
    if (!videoId) {
        throw new ApiError(400, "Video ID is required");
    }

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Comment content is required");
    }

    try {
        // Ensure the video exists
        const video = await Video.findById(videoId);
        if (!video) {
            throw new ApiError(404, "Video not found");
        }

        // Create a new comment
        const comment = await Comment.create({
            video: videoId,
            owner: req.user.id, // Assuming `req.user` contains the authenticated user
            content
        });

        // Return the created comment
        return res
            .status(201)
            .json(new ApiResponse(201, comment, "Comment added successfully"));
    } catch (error) {
        // Handle errors
        throw new ApiError(500, error.message || "An error occurred while adding the comment");
    }
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    // Validate inputs
    if (!commentId) {
        throw new ApiError(400, "Comment ID is required");
    }

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Comment content is required");
    }

    try {
        // Ensure the comment exists
        const comment = await Comment.findById(commentId);
        if (!comment) {
            throw new ApiError(404, "Comment not found");
        }

        // ✅ Check if the logged-in user is the owner of the comment
        if (comment.owner.toString() !== userId.toString()) {
            throw new ApiError(403, "You are not authorized to update this comment");
        }

        // Update the comment
        comment.content = content;
        await comment.save();

        // Return the updated comment
        return res
            .status(200)
            .json(new ApiResponse(200, comment, "Comment updated successfully"));
    } catch (error) {
        // Handle errors
        throw new ApiError(500, error.message || "An error occurred while updating the comment");
    }
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params;
    const userId = req.user._id;

    // Validate inputs
    if (!commentId) {
        throw new ApiError(400, "Comment ID is required");
    }

    try {
        // Ensure the comment exists
        const comment = await Comment.findById(commentId);
        if (!comment) {
            throw new ApiError(404, "Comment not found");
        }

        // ✅ Check if the logged-in user is the owner of the comment
        if (comment.owner.toString() !== userId.toString()) {
            throw new ApiError(403, "You are not authorized to delete this comment");
        }

        // Delete the comment
        await comment.deleteOne({ _id: commentId });

        // Return a success response
        return res
            .status(200)
            .json(new ApiResponse(200, null, "Comment deleted successfully"));
    } catch (error) {
        // Handle errors
        throw new ApiError(500, error.message || "An error occurred while deleting the comment");
    }
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}