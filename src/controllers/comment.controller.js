import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query
    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "invalid video id")
    }
    const numericPage = Math.max(parseInt(page) || 1, 1)
    const numericLimit = Math.min(Math.max(parseInt(limit) || 10, 1), 100)

    const pipeline = [
        { $match: { video: new mongoose.Types.ObjectId(videoId) } },
        { $sort: { createdAt: -1 } },
        { $skip: (numericPage - 1) * numericLimit },
        { $limit: numericLimit },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [ { $project: { fullName: 1, username: 1, avatar: 1 } } ]
            }
        },
        { $addFields: { owner: { $first: "$owner" } } }
    ]

    const [items, total] = await Promise.all([
        Comment.aggregate(pipeline),
        Comment.countDocuments({ video: videoId })
    ])

    return res.status(200).json(new ApiResponse(200, {
        items,
        page: numericPage,
        limit: numericLimit,
        total,
        totalPages: Math.ceil(total / numericLimit)
    }, "Comments fetched"))
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { videoId } = req.params
    const { content } = req.body
    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "invalid video id")
    }
    if (!content || !content.trim()) {
        throw new ApiError(400, "content is required")
    }
    const created = await Comment.create({
        content: content.trim(),
        video: videoId,
        owner: req.user?._id
    })
    return res.status(201).json(new ApiResponse(201, created, "Comment added"))
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { commentId } = req.params
    const { content } = req.body
    if (!mongoose.isValidObjectId(commentId)) {
        throw new ApiError(400, "invalid comment id")
    }
    if (!content || !content.trim()) {
        throw new ApiError(400, "content is required")
    }
    const updated = await Comment.findOneAndUpdate(
        { _id: commentId, owner: req.user?._id },
        { $set: { content: content.trim() } },
        { new: true }
    )
    if (!updated) {
        throw new ApiError(404, "comment not found or not owned by user")
    }
    return res.status(200).json(new ApiResponse(200, updated, "Comment updated"))
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params
    if (!mongoose.isValidObjectId(commentId)) {
        throw new ApiError(400, "invalid comment id")
    }
    const deleted = await Comment.findOneAndDelete({ _id: commentId, owner: req.user?._id })
    if (!deleted) {
        throw new ApiError(404, "comment not found or not owned by user")
    }
    return res.status(200).json(new ApiResponse(200, {}, "Comment deleted"))
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }
