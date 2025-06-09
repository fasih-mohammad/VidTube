//this route is created to periodically check the health of the web server and if it is functioning correctly
//now for defining any new route or functionality :
//1. define controller in the below mentioned way
//2. define its route in routes folder
//3. use it in app.js as app.use 
//when a request is hit on the healthcheck route mentioned in app.js in app.use flow control is as follows
// app.js -> healthcheck.routes.js -> healthcheck.controller.js is rendered and body is executed...
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const healthCheck = asyncHandler(async(req,res)=>{
    return res
        .status(200)
        .json(new ApiResponse(200,"OK","Health check passed"))
})
export {healthCheck}