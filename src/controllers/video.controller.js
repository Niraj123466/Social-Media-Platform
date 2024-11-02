import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    const numericPage = Math.max(parseInt(page) || 1, 1)
    const numericLimit = Math.min(Math.max(parseInt(limit) || 10, 1), 100)

    const match = {}
    if (query) {
        match.$or = [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } }
        ]
    }
    if (userId && isValidObjectId(userId)) {
        match.owner = new mongoose.Types.ObjectId(userId)
    }

    const sort = {}
    if (sortBy) {
        const direction = (String(sortType).toLowerCase() === "asc") ? 1 : -1
        sort[sortBy] = direction
    } else {
        sort.createdAt = -1
    }

    const pipeline = [
        { $match: match },
        { $sort: sort },
        { $skip: (numericPage - 1) * numericLimit },
        { $limit: numericLimit },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    { $project: { fullName: 1, username: 1, avatar: 1 } }
                ]
            }
        },
        { $addFields: { owner: { $first: "$owner" } } }
    ]

    const [items, total] = await Promise.all([
        Video.aggregate(pipeline),
        Video.countDocuments(match)
    ])

    return res.status(200).json(new ApiResponse(200, {
        items,
        page: numericPage,
        limit: numericLimit,
        total,
        totalPages: Math.ceil(total / numericLimit)
    }, "Videos fetched"))
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    const videoFileLocalPath = req.files?.videoFile?.[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path

    if (!title || !description) {
        throw new ApiError(400, "title and description are required")
    }
    if (!videoFileLocalPath || !thumbnailLocalPath) {
        throw new ApiError(400, "videoFile and thumbnail are required")
    }

    const uploadedVideo = await uploadOnCloudinary(videoFileLocalPath)
    const uploadedThumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if (!uploadedVideo?.url || !uploadedThumbnail?.url) {
        throw new ApiError(400, "failed to upload video or thumbnail")
    }

    const videoDoc = await Video.create({
        title,
        description,
        videoFile: uploadedVideo.url,
        thumbnail: uploadedThumbnail.url,
        duration: Number(uploadedVideo.duration) || 0,
        owner: req.user?._id
    })

    return res.status(201).json(new ApiResponse(201, videoDoc, "Video published"))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "invalid video id")
    }
    const video = await Video.findById(videoId).populate("owner", "fullName username avatar")
    if (!video) {
        throw new ApiError(404, "video not found")
    }
    return res.status(200).json(new ApiResponse(200, video, "Video fetched"))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "invalid video id")
    }
    const updates = {}
    if (req.body?.title) updates.title = req.body.title
    if (req.body?.description) updates.description = req.body.description
    if (req.file?.path) {
        const uploadedThumb = await uploadOnCloudinary(req.file.path)
        if (!uploadedThumb?.url) {
            throw new ApiError(400, "failed to upload thumbnail")
        }
        updates.thumbnail = uploadedThumb.url
    }
    const updated = await Video.findOneAndUpdate({ _id: videoId, owner: req.user?._id }, { $set: updates }, { new: true })
    if (!updated) {
        throw new ApiError(404, "video not found or not owned by user")
    }
    return res.status(200).json(new ApiResponse(200, updated, "Video updated"))
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "invalid video id")
    }
    const deleted = await Video.findOneAndDelete({ _id: videoId, owner: req.user?._id })
    if (!deleted) {
        throw new ApiError(404, "video not found or not owned by user")
    }
    return res.status(200).json(new ApiResponse(200, {}, "Video deleted"))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "invalid video id")
    }
    const video = await Video.findOne({ _id: videoId, owner: req.user?._id })
    if (!video) {
        throw new ApiError(404, "video not found or not owned by user")
    }
    video.isPublished = !video.isPublished
    await video.save()
    return res.status(200).json(new ApiResponse(200, { isPublished: video.isPublished }, "Publish status toggled"))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
