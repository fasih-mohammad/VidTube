import { Router } from "express";
import {upload} from "../middlewares/multer.middlewares.js"
import { registerUser,logoutUser, loginUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, getUserChannelProfile, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getWatchHistory} from "../controllers/user.controllers.js";
import {verifyJWT} from "../middlewares/auth.middlewares.js"

const router = Router()

//unsecured routes-anyone can access these routes without authentication since everyone is allowed to register.

router.route("/register").post(//inside post etc methods all the middlewares and controllers that need to be executed are mentioned
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },{
            name:"coverImage",
            maxCount:1
        }
    ])
    ,registerUser)

router.route("/login").post(loginUser)
router.route("/refresh-token").post(refreshAccessToken)//now with each request and response the access token travels with it and when access token expires, we have to create a new route that is responsible to generate both tokens now when access token expires user can send a request to that route alongwith the refresh token and it can be regenerated.


//secured routes-only existing users are allowed to access these routes since for logging out we must already have to be logged in. 
//for accessing  these routes user must be authenticated or logged in first
router.route("/logout").post(verifyJWT,logoutUser)//if more that one middlewares/controllers are written then the control passess from 1st middleware to next middleware through next() function.

router.route("/change-password").post(verifyJWT,changeCurrentPassword)
router.route("/current-user").get(verifyJWT,getCurrentUser)
router.route("/c/:username").get(verifyJWT,getUserChannelProfile)//route is mentioned in this way bcoz controller is expecting username in url as req.params
router.route("/update-account").patch(verifyJWT,updateAccountDetails)
router.route("/avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar)
router.route("/cover-image").patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage)
router.route("/history").get(verifyJWT,getWatchHistory)

export default router