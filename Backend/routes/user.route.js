import { Router } from 'express';
const router = Router();
import upload from '../middlewares/multer.middleware.js';
import verifyJWT from '../middlewares/auth.middleware.js';
import {
    registerUser,
    loginUser,
    logoutUser,
    refreshToken,
    getCurrentUser,
    updatePassword,
    updateUserAvatar,
    updateUserCoverImage,
    updateUseremail,
    updateUserfullName,
    SubscribeToChannel,
    UnsubscribeFromChannel,
    getUserChannelProfile,
    getwatchHistory
} from '../controllers/user.controller.js';

router.route('/register').post(
    upload.fields([
        { name: 'avatar', maxCount: 1 },
        { name: 'coverimage', maxCount: 1 }
    ])
    // , for multipart/form-data handling, uncomment the above lines and use upload.fields() middleware
    , registerUser
);

//login user route
router.route('/loginuser').post(
    loginUser
);

// router.route('/login').post(loginUser);

//logout user route
router.route('/logoutuser').post(
    verifyJWT,
    logoutUser
);


router.route('/refresh-token').get(
    verifyJWT,
    refreshToken
);


router.route('/currentuser').get(
    verifyJWT,
    getCurrentUser
);


//put request instead of post request for updating user details
router.route('/updateemail').patch(
    verifyJWT,
    updateUseremail
);

router.route('/updatefullname').patch(
    verifyJWT,
    updateUserfullName
);

router.route('/updatepassword').patch(
    verifyJWT,
    updatePassword
);

router.route('/updateavatar').patch(
    verifyJWT,
    upload.single('avatar'),
    updateUserAvatar
);

router.route('/updatecoverimage').patch(
    verifyJWT,
    upload.single('coverimage'),
    updateUserCoverImage
);

router.route('/subscribe/:username').post(
    verifyJWT,
    SubscribeToChannel
);

router.route('/unsubscribe/:username').delete(
    verifyJWT,
    UnsubscribeFromChannel
);

router.route('/channel/:username').get(
    getUserChannelProfile
);

router.route('/watchhistory').get(
    verifyJWT,
    getwatchHistory
);
console.log("User routes loaded");
export default router;