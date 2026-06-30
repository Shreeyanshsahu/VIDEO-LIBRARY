import {Router} from 'express';
const router = Router();
import upload from '../middlewares/multer.middleware.js';
import { registerUser,loginUser,logoutUse,refreshToken } from '../controllers/user.controller.js';
import verifyJWT from '../middlewares/auth.middleware.js';

router.route('/register').post(
    upload.fields([
        { name: 'avatar', maxCount: 1 },
        { name: 'coverimage', maxCount: 1 }
    ])
    // , for multipart/form-data handling, uncomment the above lines and use upload.fields() middleware
    ,registerUser
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

console.log("User routes loaded");
export default router;