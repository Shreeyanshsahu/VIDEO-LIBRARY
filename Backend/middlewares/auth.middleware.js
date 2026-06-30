import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";
const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.split(" ")[1];
        // Get the access token from cookies through the request object.
        if (!token) {
            return res.status(401).json({ message: "Unauthorized request" });
        }
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
            if (err) {
                return res.status(403).json({ message: "Forbidden" });
            }
            req.user = decoded; // Attach the decoded user information to the request object
        });
        const user = await User.findById(req.user._id).select("-password -refreshtoken");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        req.user = user; // Attach the user object to the request for further use
        next();
    } catch (error) {
        console.error("Error in verifyJWT middleware:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

export default verifyJWT;