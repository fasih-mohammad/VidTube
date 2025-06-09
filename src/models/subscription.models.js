import mongoose,{Schema} from "mongoose";

/*
subscriber ObjectId users
  channel ObjectId users
  */

const subscriptionSchema = new Schema({
    subscriber:{
        type: Schema.Types.ObjectId,//one who is SUBSCRIBING
        ref:"User"
    },
    channel:{
        type:Schema.Types.ObjectId,//one to whom 'subscriber' is subscribing
        ref: "User"
    }
},{timestamps:true})

export const Subscription = mongoose.model("Subscription",subscriptionSchema);