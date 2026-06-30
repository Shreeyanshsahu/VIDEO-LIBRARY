import { ApiError } from "./ApiError.js";

/*
|--------------------------------------------------------------------------
| Required Fields
|--------------------------------------------------------------------------
*/

export const validateRequiredFields = (fields) => {

    const isEmpty = Object.entries(fields).find(
        ([key, value]) =>
            value === undefined ||
            value === null ||
            value.toString().trim() === ""
    );

    if (isEmpty) {
        throw new ApiError(
            400,
            `${isEmpty[0]} is required`
        );
    }
};

/*
|--------------------------------------------------------------------------
| Email Validation
|--------------------------------------------------------------------------
*/

export const validateEmail = (email) => {

    const regex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!regex.test(email)) {
        throw new ApiError(
            400,
            "Invalid Email"
        );
    }
};

/*
|--------------------------------------------------------------------------
| Username Validation
|--------------------------------------------------------------------------
*/

export const validateUsername = (username) => {

    const regex =
        /^[a-zA-Z0-9_.]+$/;

    if (!regex.test(username)) {
        throw new ApiError(
            400,
            "Username can contain only letters, numbers, _ and ."
        );
    }

    if (username.length < 3 || username.length > 20) {
        throw new ApiError(
            400,
            "Username should be 3-20 characters"
        );
    }
};

/*
|--------------------------------------------------------------------------
| Password Validation
|--------------------------------------------------------------------------
*/

export const validatePassword = (password) => {

    if (password.length < 8) {
        throw new ApiError(
            400,
            "Password must be at least 8 characters"
        );
    }

    const regex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

    if (!regex.test(password)) {
        throw new ApiError(
            400,
            "Password must contain uppercase, lowercase, number and special character."
        );
    }
};

/*
|--------------------------------------------------------------------------
| Full Name Validation
|--------------------------------------------------------------------------
*/

export const validateFullName = (name) => {

    if (name.length < 1) {
        throw new ApiError(
            400,
            "Full Name is too short"
        );
    }

    if (name.length > 50) {
        throw new ApiError(
            400,
            "Full Name is too long"
        );
    }
};

/*
|--------------------------------------------------------------------------
| Reserved Usernames
|--------------------------------------------------------------------------
*/

export const validateReservedUsername = (username) => {

    const reserved = [
        "admin",
        "root",
        "owner",
        "youtube",
        "support"
    ];

    if (reserved.includes(username.toLowerCase())) {
        throw new ApiError(
            400,
            "Username is reserved"
        );
    }
};

/*
|--------------------------------------------------------------------------
| Image Upload Validation
|--------------------------------------------------------------------------
*/

export const validateAvatar = (avatar) => {

    if (!avatar) {
        throw new ApiError(
            400,
            "Avatar is required"
        );
    }
};

export const validateCloudinaryUpload = (image) => {

    if (!image || !image.secure_url) {
        throw new ApiError(
            500,
            "Cloudinary Upload Failed"
        );
    }
};