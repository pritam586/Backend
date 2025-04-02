import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOncloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"

const registerUser = asyncHandler( async (req,res)=>{
    // get user detail from frontend
    //validation  - Not Empty
    //check  if user already exist  : using username annd email
    //check for images
    //chck for avatar
    //upload them on cloudinary , avatar
    // create user object- create user entry on db
    // remove password and refreshtoken field from response
    // check user creation 
    // return res


    // getting user Dertail from frontend
    const {fullname , email , username , password} =  req.body
    console.log("email: ",email)

    if(
        [fullname , email , username , password].some((field)=>field?.trim()==="")
    ){
        throw new ApiError(400 , "All feild are required")
    }

    const existedUser =  User.findOne({
        $or:[{username}, {email}]
    })
   
    if(existedUser){
        throw ApiError(409 , "User with username and email already exists")
    }
    
    const avatarLocalPath= req.files?.avatar[0]?.path;
    const coverImagePath = req.files?.coverImage[0]?.path;
    
    if(!avatarLocalPath){
        throw new ApiError(400 ,"Avatar File is required")
    }

    const avatar = await uploadOncloudinary(avatarLocalPath)
    const coverImage = await uploadOncloudinary(coverImagePath)

    if(!avatar){
        throw new ApiError(400 , "Avatar is required")
    }

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLoweCase()
    })

    const createdUser= await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500 , "Someting went wrong while registering user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser , "User Register successfully")
    )

})

export {registerUser}