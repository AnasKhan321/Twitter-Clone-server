import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { prismaClient } from "../clients/db";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { redisclient } from "../clients/redis";

import { fromEnv } from "@aws-sdk/credential-providers";
interface TweetPayload {
    content : string 
    imageURL : string | undefined
    id : string
}

const s3Client = new S3Client({})

export class TweetService {


        public static async CreateTweet(payload : TweetPayload ){

            const flag = await redisclient.get(`TWEET:USER:${payload.id}`)
            if(flag){
                throw new Error("Please Wait some time")
            }
            await redisclient.del("ALLTWEETS")
            const tweet  = await prismaClient.tweet.create({
                data : {
                    content  : payload.content , 
                    imageURL : payload.imageURL  , 
                    author : {connect : {id :payload.id}}
                    
                }
            })
            await redisclient.set(`TWEET:USER:${payload.id}`  , payload.id , "EX"  , 30)

            return tweet ; 
        }

        public static async GetAllTweets(){
            const cachedTweets = await redisclient.get("ALLTWEETS")
            if(cachedTweets){
                console.log("cached found")
                return JSON.parse(cachedTweets)
            }
            console.log("cahced")
            const tweets = await prismaClient.tweet.findMany({orderBy : {createdAt : "desc"}})
            await redisclient.set(
                "ALLTWEETS", // Key
                JSON.stringify(tweets), 
                "EX",
                3600// Value
                 
              );
            return tweets ; 
        }

        public static async  GetsignedUrl(imageName : string , imageType : string  , id : string){
            const putObject =   new PutObjectCommand({
                Bucket : process.env.AWS_S3_BUCKET_NAME  , 
                Key : `uploads/${id}/tweets/${imageName}-${Date.now().toString()}.${imageType}`
            })
    
            const signedUrl  = await getSignedUrl(s3Client , putObject )
            return signedUrl ; 
        }

}