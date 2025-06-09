/*users [icon: user] {
  id string pk // id attribute is not explicitly defined in schema definition since while creation of a document in mongoDb , by default it defines an id attribute for each record and stores hexadecimal values in it for unique retrieval.
  username string
  email string
  fullName string
  avatar string
  coverImage string
  watchHistory ObjectId[] videos
  password string
  refreshToken string
  createdAt Date //
  updatedAt Date
}*/
import mongoose,{Schema} from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },
        email:{
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },
        fullname:{
            type: String,
            required: true,
            trim: true,
            index: true
        },
        avatar:{
            type: String,//cloudinary URL
            required: true,
        },
        coverImage:{
            type: String//cloudinary URL
        },
        watchHistory:[
            {
                type:Schema.Types.ObjectId,
                ref:"Video"
            }
        ],
        password:{
            type: String,
            required: [true,"password is required"]//in required attribute we can also define the message that can be returned in case the field is left empty in an array
        },
        refreshToken:{
            type: String,
        }
    },
    {timestamps: true} // mongoose creates default createdAt and updatedAt fields if timestamps field is marked true. 
)

userSchema.pre("save",async function(next){//schema.pre defines a pre hook for the model meaning "just before saving data in the db this hook will execute and callback function mentioned as parameter will run"
    if(!this.isModified("password")) return next()//on 1st time when data is saved into the database only then the hash function will encrypt the provided password but the function won't run everytime there is any change in the database.
    this.password = await bcrypt.hash(this.password,10)
    next()//it is a middleware that passes the control to next middleware or server.
})

userSchema.methods.isPasswordCorrect = async function(password){//monggose allows us to define user-defined methods on a particular schema along with mongoDb methods like schema.findOne() etc... and are called like the same.
    return await bcrypt.compare(password,this.password);
}

userSchema.methods.generateAccessToken = function(){
    //short lived access token
    return jwt.sign({//Synchronously sign the given payload into a JSON Web Token string payload - Payload to sign, could be an literal, buffer or string secretOrPrivateKey - Either the secret for HMAC algorithms, or the PEM encoded private key for RSA and ECDSA. [options] - Options for the signature returns - The JSON Web Token string
        _id: this._id,
        email: this.email,
        username: this.username,
        fullname: this.fullname
    },
    process.env.ACCESS_TOKEN_SECRET,
    {expiresIn: process.env.ACCESS_TOKEN_EXPIRY}
    )
}

userSchema.methods.generateRefreshToken = function(){
    //short lived access token
    return jwt.sign({//Synchronously sign the given payload into a JSON Web Token string payload - Payload to sign, could be an literal, buffer or string secretOrPrivateKey - Either the secret for HMAC algorithms, or the PEM encoded private key for RSA and ECDSA. [options] - Options for the signature returns - The JSON Web Token string
        _id: this._id // access token can contain multiple fields as payload but refresh token contains only one unique field as payload.
    },
    process.env.REFRESH_TOKEN_SECRET,
    {expiresIn: process.env.REFRESH_TOKEN_EXPIRY}
    )
}


export const User = mongoose.model("User",userSchema);//this statement creates a mongoDb document using schema defined above along with the constraints.
//mongoose also acts an intermediate layer for data validation by defining rules in schema definition.