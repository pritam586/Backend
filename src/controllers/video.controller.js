import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOncloudinary} from "../utils/cloudinary.js"

const getAllVideos = asyncHandler(async (req, res) => {
   const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query 
   //TODO: get all videos based on query, sort, pagination
    page = parseInt(page);
    limit = parseInt(limit);

    // check user
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(401, "User not found");
    }

    //  sort order
    const sortOrder = sortType === "asc" ? 1 : -1;

    //  allowed fields (important)
    const allowedFields = ["views", "createdAt", "title"];
    if (!allowedFields.includes(sortBy)) {
        sortBy = "createdAt";
    }

    //  match stage (search/filter)
    let matchStage = {};
    if (query) {
        matchStage.title = { $regex: query, $options: "i" }; // search by title
    }

    // aggregation pipeline
    const aggregate = Video.aggregate([
        {
            $match: matchStage
        },
        {
            $sort: { [sortBy]: sortOrder }
        }
    ]);

    // pagination options
    const options = {
        page,
        limit
    };

    //  execute
    const result = await Video.aggregatePaginate(aggregate, options);

    return res.status(200).json(
        new ApiResponse(200, result, "Videos fetched successfully")
    );
});
const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    // validation
    if (!title || !description) {
        throw new ApiError(400, "Title and description are required");
    }

    //  get file paths
    const videoPath = req.files?.video?.[0]?.path;
    const thumbnailPath = req.files?.thumbnail?.[0]?.path;

    if (!videoPath) {
        throw new ApiError(400, "Video file is required");
    }

    //  upload to cloudinary
    const uploadedVideo = await uploadOncloudinary(videoPath);
    const uploadedThumbnail = thumbnailPath
        ? await uploadOncloudinary(thumbnailPath)
        : null;

    if (!uploadedVideo) {
        throw new ApiError(500, "Error while uploading video");
    }

    //  create video in DB
    const newVideo = await Video.create({
        title,
        description,
        videoFile: uploadedVideo.url,
        thumbnail: uploadedThumbnail?.url || "",
        owner: req.user?._id, // make sure auth middleware sets req.user
    });

    //  response
    return res.status(201).json(
        new ApiResponse(201, newVideo, "Video uploaded successfully")
    );
});
const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}