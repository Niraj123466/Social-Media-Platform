import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    //TODO: create playlist
    if (!name || !description) {
        throw new ApiError(400, "name and description are required")
    }
    const playlist = await Playlist.create({ name, description, owner: req.user?._id })
    return res.status(201).json(new ApiResponse(201, playlist, "Playlist created"))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "invalid user id")
    }
    const items = await Playlist.find({ owner: userId }).populate("videos").sort({ createdAt: -1 })
    return res.status(200).json(new ApiResponse(200, items, "Playlists fetched"))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "invalid playlist id")
    }
    const playlist = await Playlist.findById(playlistId).populate({ path: "videos", populate: { path: "owner", select: "fullName username avatar" } })
    if (!playlist) {
        throw new ApiError(404, "playlist not found")
    }
    return res.status(200).json(new ApiResponse(200, playlist, "Playlist fetched"))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "invalid ids")
    }
    const updated = await Playlist.findOneAndUpdate(
        { _id: playlistId, owner: req.user?._id },
        { $addToSet: { videos: videoId } },
        { new: true }
    )
    if (!updated) {
        throw new ApiError(404, "playlist not found or not owned by user")
    }
    return res.status(200).json(new ApiResponse(200, updated, "Video added to playlist"))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "invalid ids")
    }
    const updated = await Playlist.findOneAndUpdate(
        { _id: playlistId, owner: req.user?._id },
        { $pull: { videos: videoId } },
        { new: true }
    )
    if (!updated) {
        throw new ApiError(404, "playlist not found or not owned by user")
    }
    return res.status(200).json(new ApiResponse(200, updated, "Video removed from playlist"))
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "invalid playlist id")
    }
    const deleted = await Playlist.findOneAndDelete({ _id: playlistId, owner: req.user?._id })
    if (!deleted) {
        throw new ApiError(404, "playlist not found or not owned by user")
    }
    return res.status(200).json(new ApiResponse(200, {}, "Playlist deleted"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "invalid playlist id")
    }
    const set = {}
    if (name) set.name = name
    if (description) set.description = description
    const updated = await Playlist.findOneAndUpdate({ _id: playlistId, owner: req.user?._id }, { $set: set }, { new: true })
    if (!updated) {
        throw new ApiError(404, "playlist not found or not owned by user")
    }
    return res.status(200).json(new ApiResponse(200, updated, "Playlist updated"))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
