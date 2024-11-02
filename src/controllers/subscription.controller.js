import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "invalid channel id")
    }
    if (String(req.user?._id) === String(channelId)) {
        throw new ApiError(400, "cannot subscribe to self")
    }
    const existing = await Subscription.findOne({ channel: channelId, subscriber: req.user?._id })
    if (existing) {
        await Subscription.deleteOne({ _id: existing._id })
        return res.status(200).json(new ApiResponse(200, { subscribed: false }, "Unsubscribed"))
    }
    await Subscription.create({ channel: channelId, subscriber: req.user?._id })
    return res.status(201).json(new ApiResponse(201, { subscribed: true }, "Subscribed"))
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "invalid channel id")
    }
    const subs = await Subscription.find({ channel: channelId }).populate("subscriber", "fullName username avatar")
    return res.status(200).json(new ApiResponse(200, subs, "Channel subscribers fetched"))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "invalid subscriber id")
    }
    const channels = await Subscription.find({ subscriber: subscriberId }).populate("channel", "fullName username avatar")
    return res.status(200).json(new ApiResponse(200, channels, "Subscribed channels fetched"))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}