import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { content } = req.body
    if (!content || !content.trim()) {
        throw new ApiError(400, "content is required")
    }
    const tweet = await Tweet.create({ content: content.trim(), owner: req.user?._id })
    return res.status(201).json(new ApiResponse(201, tweet, "Tweet created"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const { userId } = req.params
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "invalid user id")
    }
    const tweets = await Tweet.find({ owner: userId }).sort({ createdAt: -1 })
    return res.status(200).json(new ApiResponse(200, tweets, "Tweets fetched"))
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { tweetId } = req.params
    const { content } = req.body
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "invalid tweet id")
    }
    if (!content || !content.trim()) {
        throw new ApiError(400, "content is required")
    }
    const updated = await Tweet.findOneAndUpdate(
        { _id: tweetId, owner: req.user?._id },
        { $set: { content: content.trim() } },
        { new: true }
    )
    if (!updated) {
        throw new ApiError(404, "tweet not found or not owned by user")
    }
    return res.status(200).json(new ApiResponse(200, updated, "Tweet updated"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.params
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "invalid tweet id")
    }
    const deleted = await Tweet.findOneAndDelete({ _id: tweetId, owner: req.user?._id })
    if (!deleted) {
        throw new ApiError(404, "tweet not found or not owned by user")
    }
    return res.status(200).json(new ApiResponse(200, {}, "Tweet deleted"))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
