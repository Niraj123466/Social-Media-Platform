import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "invalid video id")
    }
    const existing = await Like.findOne({ video: videoId, likedBy: req.user?._id })
    if (existing) {
        await Like.deleteOne({ _id: existing._id })
        return res.status(200).json(new ApiResponse(200, { liked: false }, "Unliked video"))
    }
    await Like.create({ video: videoId, likedBy: req.user?._id })
    return res.status(201).json(new ApiResponse(201, { liked: true }, "Liked video"))
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "invalid comment id")
    }
    const existing = await Like.findOne({ comment: commentId, likedBy: req.user?._id })
    if (existing) {
        await Like.deleteOne({ _id: existing._id })
        return res.status(200).json(new ApiResponse(200, { liked: false }, "Unliked comment"))
    }
    await Like.create({ comment: commentId, likedBy: req.user?._id })
    return res.status(201).json(new ApiResponse(201, { liked: true }, "Liked comment"))

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "invalid tweet id")
    }
    const existing = await Like.findOne({ tweet: tweetId, likedBy: req.user?._id })
    if (existing) {
        await Like.deleteOne({ _id: existing._id })
        return res.status(200).json(new ApiResponse(200, { liked: false }, "Unliked tweet"))
    }
    await Like.create({ tweet: tweetId, likedBy: req.user?._id })
    return res.status(201).json(new ApiResponse(201, { liked: true }, "Liked tweet"))
})

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const likes = await Like.find({ likedBy: req.user?._id, video: { $ne: null } })
        .populate({ path: "video", populate: { path: "owner", select: "fullName username avatar" } })
        .sort({ createdAt: -1 })
    const videos = likes.map(l => l.video).filter(Boolean)
    return res.status(200).json(new ApiResponse(200, videos, "Liked videos fetched"))
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}