import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.models.js";
import { Subscription } from "../models/subscription.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Toggle subscription (subscribe/unsubscribe)
const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const subscriberId = req.user._id;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    if (subscriberId.toString() === channelId.toString()) {
        throw new ApiError(400, "You cannot subscribe to yourself");
    }

    const channel = await User.findById(channelId);
    if (!channel) {
        throw new ApiError(404, "Channel not found");
    }

    const existingSubscription = await Subscription.findOne({
        subscriber: subscriberId,
        channel: channelId
    });

    if (existingSubscription) {
        await existingSubscription.deleteOne();
        return res.status(200).json(new ApiResponse(200, null, "Unsubscribed successfully"));
    } else {
        await Subscription.create({
            subscriber: subscriberId,
            channel: channelId
        });
        return res.status(200).json(new ApiResponse(200, null, "Subscribed successfully"));
    }
});

// Get subscribers of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    const subscribers = await Subscription.find({ channel: channelId }).populate({
        path: "subscriber",
        select: "username fullname avatar"
    });

    res.status(200).json(new ApiResponse(200, subscribers, "Subscriber list fetched successfully"));
});

// Get all channels the user has subscribed to
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriber ID");
    }

    const subscriptions = await Subscription.find({ subscriber: subscriberId }).populate({
        path: "channel",
        select: "username fullname avatar"
    });

    res.status(200).json(new ApiResponse(200, subscriptions, "Subscribed channels fetched successfully"));
});

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
};
/* This code fetches all users who subscribed to a specific channel, and then populates their basic user info from the User model.  Subscription.find({ channel: channelId })
→ Get all subscription documents where the channel field matches the given channelId.  .populate({ path: "subscriber", ... })
→ Replace the subscriber ObjectId with the actual User document that matches it.
select: "username fullname avatar"
→ Only fetch these three fields from the User document, not everything (like email or password).
You’re doing a join between Subscription and User collections.
Think of it like:
"Give me the list of all subscribers of this channel, and show me their usernames, full names, and avatars."
Suppose your Subscription model looks like this:
const subscriptionSchema = new Schema({
    subscriber: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    channel: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }
});
The subscriber field holds a reference (ObjectId) to a document in the User collection.
💬 So when you write:
.populate({
  path: "subscriber",
  select: "username fullname avatar"
})
You’re saying:
"Go to the subscriber field, follow its ObjectId, and replace it with the actual User document (but only include username, fullname, and avatar fields)."
🧾 Without populate():
{
  "subscriber": "665abc123de456f...",
  "channel": "665def789gh012i..."
}
✅ With populate({ path: "subscriber", select: "..." }):
{
  "subscriber": {
    "username": "fasihkhan",
    "fullname": "Fasih Mohammad Khan",
    "avatar": "https://..."
  },
  "channel": "665def789gh012i..."
}
 */