import { Tweet } from "@prisma/client";

import { prismaClient } from "../../clients/db";
import { Grapqhlcontext } from "../../interfaces";
import { S3Client , PutObjectCommand } from "@aws-sdk/client-s3";
import  {getSignedUrl}  from "@aws-sdk/s3-request-presigner" 
import { UserService } from "../../services/Userservices";
import { TweetService } from "../../services/TweetServices";

interface CreateTweetPayload {
        content : string 
        imageURL? : string
 
}



const mutations = {
    createTweet : async(parent  : any , {payload}  : {payload : CreateTweetPayload}  , ctx: Grapqhlcontext)=>{
            if(!ctx.user?.id) throw new Error("You are not authenticated")
            const tweet  = await TweetService.CreateTweet({ content  : payload.content , imageURL : payload.imageURL  ,id :ctx.user.id})
            return tweet ; 
    }
}


export const query = {
    getAllTweets  : ()=> TweetService.GetAllTweets() ,


    getSignedURLForTweet : async(parent : any , {imageName , imageType  }  : {imageType : string  , imageName : string}  , ctx : Grapqhlcontext)=>{
        if(!ctx.user || !ctx.user.id)  throw new Error("Unauthenticated")
        
        const allowedImageTypes = ["jpg"  , "jpeg"  , "png"  , "webp"]
        if(!allowedImageTypes.includes(imageType)) throw new Error("Unsupported Image type ")

        const url = await TweetService.GetsignedUrl(imageName , imageName , ctx.user.id)
        return url ; 
    }   
}

export const extraResolvers = {
        Tweet : {
            author : (parent : Tweet )=> UserService.getuserById(parent.authorId)

        }
    
}


export const resolvers = {mutations   , extraResolvers  ,query}