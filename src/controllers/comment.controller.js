import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query
    page = parseInt(page)
    limit = parseInt(limit)
    const comments = await Comment.find({video : videoId})
    const options = {
        page,
        limit
    }
    const result = await Comment.paginate({video : videoId}, options)
    return res.status(200).json(new ApiResponse(200, result, "Comments fetched successfully"))

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params
    const {content} = req.body
    const comment = await Comment.create({
        content,
        video : videoId,
        user : req.user._id
    })
    return res.status(201).json(new ApiResponse(201, comment, "Comment added successfully"))    
    })


const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }