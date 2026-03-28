import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js';
import {User} from '../models/user.model.js';
import {uploadOncloudinary} from '../utils/cloudinary.js';
import {ApiResponse} from '../utils/ApiResponse.js';
import jwt from "jsonwebtoken"
import mongoose from 'mongoose';


const generateAccessTokenAndRefreshToken = async (userId) =>{
    try {
      const user = await User.findById(userId);
      const accessToken = user.generateAccessToken();
      const refreshToken = user.generateRefreshToken();

      user.refreshToken = refreshToken;
      await user.save({validateBeforeSave: false});
      return {accessToken, refreshToken};
    } catch (error) {
      throw new ApiError(500, "Failed to generate access token and refresh token");

    }
}

const registerUser = asyncHandler(async (req , res)=>{
  //get user data from user
  const{username, email, password , fullname} = req.body;
   
  // validation
  if(
    [username, email, password , fullname].some((field) => field?.trim()==="")
  )
  {
    throw new ApiError(400, "All fields are required");
  }

  // check if user already exists
  const existedUser = await User.findOne({
     $or:[
        {username},
        {email}
     ]
  })
  if(existedUser){
    throw new ApiError(409, "User already exists with this username or email");
  }

  // upload avatar and cover image on cloudinary and get the url of the uploaded images

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  if(!avatarLocalPath){
    throw new ApiError(400, "Avatar is required");
  }

  const avatar = await uploadOncloudinary(avatarLocalPath);
  const coverImage = await uploadOncloudinary(coverImageLocalPath);

if(!avatar){
    throw new ApiError(500, "Failed to upload avatar");
  }

  // create user in database 
  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    username: username.toLowerCase().trim(),
    email,
    password

  })
 

    // removing password and refresh token from the response    
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "Failed to create user");
    }

    return res.status(201).json(
        new ApiResponse(200 , createdUser , "User registered successfully"
        ))

})

const loginUser = asyncHandler(async (req , res)=>{
  // get email and password from request body
  const {email , password , username} = req.body;
  if(!username && !email){
    throw new ApiError(400, "Username or email is required");
  }
  // find user in database by email or username
  const user = await User.findOne({
    $or:[
        {email},
        {username}
    ]
  })


if(!user){
  throw new ApiError(404, "User not found with this email or username");
}

// check if password is correct
const isPasswordValid = await user.isPasswordCorrect(password);
if(!isPasswordValid){
    throw new ApiError(401, "Invalid password");
}

// generate access token for user and refresh token for user
  const{accessToken, refreshToken} =await generateAccessTokenAndRefreshToken(user._id)

  // send response to client with access token and refresh token in cookies
  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

  const options = {
    httpOnly: true,
    secure: true
  }

  return res.status(200)
  .cookie("refreshToken", refreshToken, options)
  .cookie("accessToken", accessToken, options)
  .json(
    new ApiResponse(200 ,
      {
        user: loggedInUser,
        accessToken,
        refreshToken
      },
        "User logged in successfully")
  )
})

const logOutUser = asyncHandler(async(req , res)=>{
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $set:{
          refreshToken: undefined
        }
      },
      {
        new: true
      }
    )

    const options = {
      httpOnly: true,
      secure: true
    }

    return res
    .status(200)
    .clearCookies("accessToken" , options)
    .clearCookies("refreshToken" . options)
    .json(new ApiResponse(200 , {} , "User logout successfully"))
})

const refreshAccessToken = asyncHandler(async(req,res)=>{
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if(incomingRefreshToken){
    throw new ApiError(401 , "Unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    )
  
    const user = await User.findById(decodedToken?._id);
    if(!user){
      throw new ApiError(401 , "Invalid refresh token");
    }
  
    if(incomingRefreshToken !== user?.refreshToken){
      throw new ApiError(401 , "Refresh token is expired or used")
    }
  
    const options={
      httpOnly: true,
      secure: true
    }
  
    const {accessToken , newRefreshToken} = await generateAccessTokenAndRefreshToken(user._id)
    return res
    .status(200)
    .cookie("accessToken" , accessToken , options)
    .cookie("refreshToken" , newRefreshToken , options)
    .json(
      new ApiResponse(
        200,
        {
          accessToken ,
          refreshToken: newRefreshToken
        },
        "Access token is refreshed "
      )
    )
  } catch (error) {
    throw new ApiError(401 , error?.message||"Invalid refresgToken")
  }
})

const changeCurrentPassword = asyncHandler(async(req , res)=>{
  const {oldPassword , newPassword} = req.body;
  const user = await User.findById(req.user?._id)
  const isPasswordCOrrect = await user.isPasswordCorrect(oldPassword)

  if(!isPasswordCOrrect){
    throw new ApiError(404  , "Invalid Password");
  }
  user.password = newPassword
  await user.save({validateBeforeSave:false})

  return res
  .status(200)
  .json(new ApiResponse(200 , {} , "Password  changed succcessfully"))
})

const getCurrentUser = asyncHandler(async(req,res)=>{
  return res
  .status(200)
  .json(new ApiResponse(200 , req.user , "Current user Fetched successfully"))
})


const updateAccountDetail = asyncHandler(async(req,res)=>{
   const {fullname , email} = req.body;

   if(!fullname && !email){
    throw new ApiError(400 , "All feild are requiured");
   }

   const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set:{
        fullname,
        email
      }
    },
    {
      new: true
    }
  ).select("-password")

  return res
  .status(200)
  .json(new ApiResponse(200, user , "Account detail is successfully "))
})

const updateUserAvatar = asyncHandler(async(req,res)=>{
  const avatarLocalPath = req.file?.path;
  if(!avatarLocalPath){
    throw new ApiError(400 , "Avatar file is missing");
  }

  const avatar   = await uploadOncloudinary(avatarLocalPath);

  if(!avatar.url){
    throw new ApiError(400 , "Error while uploading avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        avatar:avatar.url
      }
    },
    {
      new : true
    }
  ).select("-password")

  return res
  .status(200)
  .json(
    new ApiResponse(200 , user  , "Avatar Image is updated Successfully")
  )

 
})

const updateUserCoverImage = asyncHandler(async(req,res)=>{
  const CoverImageLocalPath = req.file?.path;
  if(!CoverImageLocalPath){
    throw new ApiError(400 , "coverImage file is missing");
  }

  const coverImage   = await uploadOncloudinary(CoverImageLocalPath);

  if(!coverImage.url){
    throw new ApiError(400 , "Error while uploading coverImage");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        coverImage:coverImage.url
      }
    },
    {
      new : true
    }
  ).select("-password")

  return res
  .status(200)
  .json(
    new ApiResponse(200 , user , "CoverImage is updated successfully")
  )

 
})

const getUserChannelProfile = asyncHandler(async(req ,res) =>{
  const {username} = req.params

  if(!username?.trim()){
    throw new ApiError(400 , "UserName is missing")
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase()
      }
    },
    {
      $lookup:{
        from  :"subscriptions",
        localField:"_id",
        foreignField:"channel", //subscribers
        as:"subscribers"
      }
    },
    {
       $lookup:{
        from  :"subscriptions",
        localField:"_id",
        foreignField:"subscriber", 
        as:"subscriberedTo"
      }
    },
    {
      $addFields:{
        subscribersCount:{
          $size : "$subscribers"
        },
          channelSubscribedToCount:{
             $size : "$subscriberedTo"
          },
         isSubscribed:{
          $cond :{
              if:{$in:[req.user?._id , "$subscribers.subscriber"]},
              then: true,
              else: false
          }
         }
      }
    },
    {
      $project:{
        fullname: 1,
        username:1,
        subscribersCount:1,
        channelSubscribedToCount:1,
        isSubscribed:1,
        avatar:1,
        coverImage:1,
        email:1
      }
    }

  ])

  if(!channel?.length){
    throw new ApiError(404 , "Channel doesnot exist")
  }

  return res
  .status(200)
  .json(
    new ApiResponse(200 ,channel ,  "User channel fetched successfully")
  )

})

const getWatchHistory = asyncHandler(async(req,res)=>{
  const user = await User.aggregate([
    {
      $match:{
        _id: new mongoose.Types.ObjectId(req.user._id)
      }
    },{
      $lookup:{
        from: "videos",
        localField:"watchHistory",
        foreignField:"_id",
        as:"watchHistory",
        pipeline:[
          {
            $lookup:{
              from: "users",
              localField:"owner",
              foreignField:"_id",
              as:"owner",
              pipeline:[
                {
                  $project:{
                    fullname:1,
                    username:1,
                    avatar:1
                  }
                }
              ]
            }
          },
          {
            $addFields:{
              owner:{
                $first:"$owner"
              }
            }
          }
        ]
      }
    }
  ])

  return res
  .status(200)
  .jsonn(
    new ApiResponse(200 , user[0].watchHistory , "WatchHistory is fetch successfully")
  )

})




export {
  registerUser,
  loginUser,
  logOutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetail,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory

}