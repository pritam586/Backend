import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const { channelId } = req.params;

    // Aggregate video stats
    const videoStats = await Video.aggregate([
        {
            $match: { channel: new mongoose.Types.ObjectId(channelId) }
        },
        {
            $group: {
                _id: null,
                totalViews: { $sum: "$views" },
                totalVideos: { $sum: 1 }
            }
        }
    ]);

    const totalViews = videoStats[0]?.totalViews || 0;
    const totalVideos = videoStats[0]?.totalVideos || 0;

    // Get all video IDs
    const videos = await Video.find({ channel: channelId }).select("_id");

    const videoIds = videos.map(v => v._id);

    // Likes count
    const totalLikes = await Like.countDocuments({
       
    });

    // Subscribers count
    const totalSubscribers = await Subscription.countDocuments({
        channel: channelId
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                totalViews,
                totalVideos,
                totalLikes,
                totalSubscribers
            },
            "Channel stats fetched successfully"
        )
    );
});



const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const { channelId } = req.params;
    const videos = await Video.find({ channel: channelId }).sort({ createdAt: -1 });
    return res.status(200).json(
        new ApiResponse(200, videos, "Channel videos fetched successfully")
    );
})

export {
    getChannelStats, 
    getChannelVideos
    }