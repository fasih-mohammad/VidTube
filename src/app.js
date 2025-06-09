import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
//cors is a middleware used for specifying what urls are allowed to access the server application
app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true
    })
)

//common middlewares are used for securing the application even more by specifying what types date eg. json will be recieved by the backend
app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser())

//import routes
import healthCheck from "./routes/healthcheck.routes.js";
import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js";
import commentRouter from "./routes/comment.routes.js";
import likeRouter from "./routes/like.routes.js"
import tweetRouter from "./routes/tweet.routes.js";
import playlistRouter from "./routes/playlist.routes.js"
import dashboardRoutes from "./routes/dashboard.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js"

//routes
app.use("/api/v1/healthcheck", healthCheck)
app.use("/api/v1/users", userRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/likes",likeRouter)
app.use("/api/v1/tweets",tweetRouter);
app.use("/api/v1/playlists",playlistRouter);//don't forget the slash(/) before api since while testing in postman vidtube variable is predefined and if we send request there with a slash and here we are expecting request without slash so error comes cannot post!!!
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/subscriptions", subscriptionRouter)



export { app }
