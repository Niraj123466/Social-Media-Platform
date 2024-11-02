import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const channelId = req.user?._id
    const [videosAgg, subsCount, likesAgg] = await Promise.all([
        Video.aggregate([
            { $match: { owner: new mongoose.Types.ObjectId(channelId) } },
            { $group: { _id: null, totalVideos: { $sum: 1 }, totalViews: { $sum: "$views" } } }
        ]),
        Subscription.countDocuments({ channel: channelId }),
        Like.aggregate([
            { $match: { } },
            { $lookup: { from: "videos", localField: "video", foreignField: "_id", as: "v" } },
            { $unwind: { path: "$v", preserveNullAndEmptyArrays: true } },
            { $match: { "v.owner": new mongoose.Types.ObjectId(channelId) } },
            { $group: { _id: null, totalLikes: { $sum: 1 } } }
        ])
    ])

    const stats = {
        totalVideos: videosAgg[0]?.totalVideos || 0,
        totalViews: videosAgg[0]?.totalViews || 0,
        totalSubscribers: subsCount || 0,
        totalLikes: likesAgg[0]?.totalLikes || 0
    }

    return res.status(200).json(new ApiResponse(200, stats, "Channel stats fetched"))
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const channelId = req.user?._id
    const videos = await Video.find({ owner: channelId }).sort({ createdAt: -1 })
    return res.status(200).json(new ApiResponse(200, videos, "Channel videos fetched"))
})

export {
    getChannelStats, 
    getChannelVideos
    }