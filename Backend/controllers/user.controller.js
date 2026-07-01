import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { uploadOnCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { User } from '../models/user.model.js';
import { Subscription } from '../models/subscription.model.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import {
    validateRequiredFields,
    validateEmail,
    validateUsername,
    validatePassword,
    validateFullName,
    validateReservedUsername,
    validateAvatar,
    validateCloudinaryUpload
} from "../utils/validators.js";

console.log("user.controller.js loaded");

const genrateAccessandRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError(404, "User not found.");
        }

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshtoken = refreshToken;
        await user.save({ validateBeforeSave: false });
        // Save without validation to avoid triggering pre-save hooks
        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Token generation failed.");
    }
}

// 1. Get user details from the request body.

// 2. Validate the input.
//    - Check if required fields are present.
//    - Check for empty strings.
//    - Validate email format if needed.

// 3. Check if a user already exists.
//    - Search by email or username.

// 4. Handle avatar and cover image.
//    - Check if files are uploaded.
//    - Upload them to Cloudinary.
//    - Store their URLs.

// 5. Create the user in the database.
//    - Hash the password (usually done in a Mongoose pre-save hook).
//    - Save username, email, fullName, avatar, etc.

// 6. Fetch the created user.
//    - Exclude password and refresh token from the response.

// 7. Verify the user was created successfully.

// 8. Send a success response.
const registerUser = asyncHandler(async (req, res) => {
    const { username, email, fullname, password } = req.body;
    console.log("email is:", email);
    //validate required fields

    validateRequiredFields({
        username,
        email,
        fullname,
        password,
    });

    validateEmail(email);

    validateUsername(username);

    validateReservedUsername(username);

    validatePassword(password);

    validateFullName(fullname);

    //User.findOne(   {  $or:[  {},{},{} finds multiple attributes at once in the {} of $or:[]    ]    }   )
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
        throw new ApiError(409, "User with email or username already exists.");
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverimageLocalPath = req.files?.coverimage?.[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required. for this website");
    }
    const avatar = avatarLocalPath
        ? await uploadOnCloudinary(avatarLocalPath)
        : null;
    validateCloudinaryUpload(avatar);

    const coverimage = coverimageLocalPath
        ? await uploadOnCloudinary(coverimageLocalPath)
        : null;
    validateCloudinaryUpload(coverimage);
    const user = await User.create(
        {
            username: username.toLowerCase().trim(),
            email: email.toLowerCase().trim(),
            fullname: fullname.trim(),
            password: password,
            avatar: avatar.secure_url,
            coverimage: coverimage?.secure_url || ""
        }
    )

    const createdUser = await User.findById(user._id).select("-password -refreshtoken");
    if (!createdUser) {
        throw new ApiError(500, "User creation failed.");
    }

    return res.status(201).json(new ApiResponse(
        201,
        createdUser,
        "User registered successfully.")
    );
});

// 1. Get user details from the request body.
// 2. Validate the input.
//    - Check if required fields are present.
//    - Check for empty strings.
//    - Validate email format if needed.
// 3. Check if a user exists with the provided email.
//    - If not, return an error.
// 4. Compare the provided password with the stored hashed password.
//    - If they don't match, return an error.
// 5. Generate a JWT token for the user.
// 6. create a refresh token and store it in the database (if applicable)
// 7. Exclude sensitive information from the user object before sending it in the response.
// 8. Send a success response with the token and user details in cookies.

const loginUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;
    if (!email && !username) {
        throw new ApiError(400, "Username or email is required.");
    }

    const normalizedemail = email ? email.toLowerCase() : null;
    const normalizedusername = username ? username.toLowerCase() : null;
    if (!password) {
        throw new ApiError(400, "Password is required.");
    }

    const user = await User.findOne({ $or: [{ email: normalizedemail }, { username: normalizedusername }] });// find any of those 2 
    if (!user) {
        throw new ApiError(404, "User does not exist.");
    }
    const isPasswordCorrect = await user.isPasswordCorrect(password);
    // remember that User is a mongoose model and user is an instance of that model,
    //  so user.isPasswordCorrect is a method defined in the userSchema.methods 
    // in the user.model.js file.
    // and isPasswordCorrect is a method defined in the userSchema.methods
    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid password.");
    }
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await genrateAccessandRefreshToken(user._id);
    // store refresh token in the database
    const LoggedInUser = await User.findById(user._id).select("-password -refreshtoken");
    const cookieOptions = {
        httpOnly: true,
        //httpOnly means that the cookie cannot be accessed via JavaScript, 
        // which helps mitigate XSS attacks.
        secure: process.env.NODE_ENV === "production", // Set to true in production 
        //secure means that the cookie will only be sent over HTTPS, not HTTP.
        //during development, you might be using HTTP, so set it to false in that case.
    }
    res.status(200).cookie("accessToken", newAccessToken, cookieOptions).
        cookie("refreshToken", newRefreshToken, cookieOptions).
        json(new ApiResponse(
            200,
            { user: LoggedInUser, accessToken: newAccessToken, refreshToken: newRefreshToken },
            "User logged in successfully && tokens generated successfully."
        ));//chained response with cookies and json response

});

const logoutUser = asyncHandler(async (req, res) => {
    const user = await User.findByIdAndUpdate(req.user._id, {
        $unset: {
            refreshtoken: 1
        }
    });
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
    }
    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);
    res.status(200).json(new ApiResponse(
        200,
        null,
        "User logged out successfully."
    ));
});

const refreshToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Refresh token is required.");
    }

    let decoded;

    try {
        decoded = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );
    } catch (error) {
        throw new ApiError(401, "Refresh token is invalid or expired.");
    }

    const user = await User.findById(decoded?._id);
    if (!user || user.refreshtoken !== incomingRefreshToken) {
        throw new ApiError(403, "Invalid refresh token.");
    }

    const { accessToken, refreshToken } = await genrateAccessandRefreshToken(user._id);
    await user.save({ validateBeforeSave: false });
    // accessToken &&

    // This is JavaScript's short-circuit evaluation.

    // It means:

    // "If accessToken exists (is truthy), then execute the code after &&."
    // res.cookie("name", "value", options) is a method to set a cookie in the response.
    accessToken && res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
    });

    refreshToken && res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
    });

    return res.status(200).json(new ApiResponse(
        200,
        { accessToken, refreshToken },
        "Access and refresh tokens generated successfully."
    ));

});


const getCurrentUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select("-password -refreshtoken");
    if (!user) {
        throw new ApiError(404, "User not found.");
    }
    return res.status(200).json(new ApiResponse(
        200,
        user,
        "Current user fetched successfully."
    ));
});

const updatePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
        throw new ApiError(400, "Old and new passwords are required.");
    }

    //auth validator middleware will have already verified the user and attached the user object to req.user
    const user = await User.findById(req.user._id);
    if (!user) {
        throw new ApiError(404, "User not found.");
    }

    if (!await user.isPasswordCorrect(oldPassword)) {
        throw new ApiError(401, "Old password is incorrect.");
    }

    validatePassword(newPassword);

    user.password = newPassword;
    await user.save();

    return res.status(200).json(new ApiResponse(
        200,
        null,
        "Password changed successfully."
    ));
});

const updateUserfullName = asyncHandler(async (req, res) => {
    const { fullname } = req.body;
    if (!fullname) {
        throw new ApiError(400, "Full name is required.");
    }

    validateFullName(fullname);

    const user = await User.findByIdAndUpdate(req.user._id, { $set: { fullname } }, { new: true }).select("-password -refreshtoken");
    if (!user) {
        throw new ApiError(404, "User not found.");
    }
    return res.status(200).json(new ApiResponse(
        200,
        user,
        "User full name updated successfully."
    ));
});

const updateUseremail = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) {
        throw new ApiError(400, "Email is required.");
    }

    validateEmail(email);

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new ApiError(409, "Email is already in use.");
    }

    const user = await User.findByIdAndUpdate(req.user._id, { $set: { email } }, { new: true }).select("-password -refreshtoken");
    if (!user) {
        throw new ApiError(404, "User not found.");
    }
    return res.status(200).json(new ApiResponse(
        200,
        user,
        "User email updated successfully."
    ));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required.");
    }

    let user = await User.findById(req.user._id);
    if (!user) {
        throw new ApiError(404, "User not found.");
    }

    // Delete the old avatar from Cloudinary if it exists
    if (user.avatar) {
        const publicId = user.avatar
            .split("/upload/")[1]        // v1782819739/uploads/tudmuibnbbbmucfy8e7x.jpg
            .replace(/^v\d+\//, "")      // uploads/tudmuibnbbbmucfy8e7x.jpg
            .replace(/\.[^/.]+$/, "");   // uploads/tudmuibnbbbmucfy8e7x
        await deleteFromCloudinary(publicId);
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    validateCloudinaryUpload(avatar);

    user = await User.findByIdAndUpdate(req.user._id, { $set: { avatar: avatar.secure_url } }, { new: true }).select("-password -refreshtoken");
    if (!user) {
        throw new ApiError(404, "User not found.");
    }
    return res.status(200).json(new ApiResponse(
        200,
        user,
        "User avatar updated successfully."
    ));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverimageLocalPath = req.file?.path;
    if (!coverimageLocalPath) {
        throw new ApiError(400, "Cover image is required.");
    }

    let coverimage = await uploadOnCloudinary(coverimageLocalPath);
    validateCloudinaryUpload(coverimage);

    let user = await User.findById(req.user._id);
    if (!user) {
        throw new ApiError(404, "User not found.");
    }
    //deleteprevious cover image from cloudinary if it exists
    if (user.coverimage) {
        const publicId = user.coverimage
            .split("/upload/")[1]        // v1782819739/uploads/tudmuibnbbbmucfy8e7x.jpg
            .replace(/^v\d+\//, "")      // uploads/tudmuibnbbbmucfy8e7x.jpg
            .replace(/\.[^/.]+$/, "");   // uploads/tudmuibnbbbmucfy8e7x
        await deleteFromCloudinary(publicId);
    }


    user = await User.findByIdAndUpdate(req.user._id, { $set: { coverimage: coverimage.secure_url } }, { new: true }).select("-password -refreshtoken");
    if (!user) {
        throw new ApiError(404, "User not found.");
    }
    return res.status(200).json(new ApiResponse(
        200,
        user,
        "User cover image updated successfully."
    ));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;
    if (!username?.trim()) {
        throw new ApiError(400, "Username is required.");
    }

    const channel = await User.aggregate([
        { $match: { username: username?.toLowerCase().trim() } },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: { $size: "$subscribers" },
                subscribedToCount: { $size: "$subscribedTo" },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                },
            }
        },
        { $project: { password: 0, refreshtoken: 0, subscribers: 0, subscribedTo: 0 } }
    ]);

    if (!channel.length) {
        throw new ApiError(404, "Channel not found.");
    }

    return res.status(200).json(new ApiResponse(
        200,
        channel[0],
        "Channel profile fetched successfully."
    ));
});

const SubscribeToChannel = asyncHandler(async (req, res) => {
    const { username } = req.params;
    if (!username) {
        throw new ApiError(400, "Username is required.");
    }
    let channel = await User.findOne({ username: username.toLowerCase().trim() });
    if (!channel) {
        throw new ApiError(404, "Channel not found.");
    }
    if (channel._id.toString() === req.user._id.toString()) {
        throw new ApiError(400, "You cannot subscribe to your own channel.");
    }
    if (!mongoose.isValidObjectId(channel._id)) {
        throw new ApiError(400, "Invalid channel ID.");
    }
    if (!channel) {
        throw new ApiError(404, "Channel not found.");
    }

    const existingSubscription = await Subscription.findOne({
        subscriber: req.user._id,
        channel: channel._id
    });

    if (existingSubscription) {
        throw new ApiError(409, "Already subscribed to this channel.");
    }
    const subscription = await Subscription.create({
        subscriber: req.user._id,
        channel: channel._id
    });

    return res.status(201).json(new ApiResponse(
        201,
        subscription,
        "Subscribed to channel successfully."
    ));
});

const UnsubscribeFromChannel = asyncHandler(async (req, res) => {
    const { username } = req.params;
    if (!username) {
        throw new ApiError(400, "Username is required.");
    }
    const channel = await User.findOne({ username: username.toLowerCase().trim() });
    if (!channel) {
        throw new ApiError(404, "Channel not found.");
    }
    if (!mongoose.isValidObjectId(channel._id)) {
        throw new ApiError(400, "Invalid channel ID.");
    }

    const subscription = await Subscription.findOneAndDelete({
        subscriber: req.user._id,
        channel: channel._id
    });

    if (!subscription) {
        throw new ApiError(404, "Subscription not found.");
    }

    return res.status(200).json(new ApiResponse(
        200,
        null,
        "Unsubscribed from channel successfully."
    ));
});

const getwatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
                // Convert the user ID to a MongoDB ObjectId for matching
                // moongoose.Types.ObjectId() is used to convert a
                //  string representation of an ObjectId 
                // into an actual ObjectId type that MongoDB can work with.
                // in user.findById(req.user._id) we can use string representation as behind the scenes
                //  mongoose will convert it to ObjectId type
                //  but in aggregate we need to convert it to ObjectId type explicitly.
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistoryDetails",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "ownerDetails",
                            pipeline: [
                                {
                                    $project: {
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    }, {
                        $addFields: {
                            owner: { $arrayElemAt: ["$ownerDetails", 0] }
                        }
                    }
                ]
            }
        },
    ]);
    return res.status(200).json(new ApiResponse(
        200,
        user[0].watchHistoryDetails,
        "User watch history fetched successfully."
    ));
});


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshToken,
    updatePassword,
    getCurrentUser,
    updateUserfullName,
    updateUseremail,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    SubscribeToChannel,
    UnsubscribeFromChannel,
    getwatchHistory
};