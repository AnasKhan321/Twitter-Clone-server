import { isAwaitKeyword, tokenToString } from "typescript"
import axios from "axios";
import { prismaClient } from "../../clients/db";
import JWTService from "../../services/jwtservices";
import { Grapqhlcontext } from "../../interfaces";
import { User } from "@prisma/client";
import { UserData, UserService } from "../../services/Userservices";
import { redisclient } from "../../clients/redis";

interface GoogleJWT {
    iss?: string | null;             // Issuer
    azp?: string | null;             // Authorized party
    aud?: string | null;             // Audience
    sub?: string | null;             // Subject (user ID)
    email: string;                   // User's email (required)
    email_verified: boolean;         // Whether the email is verified (required)
    nbf?: string | null;             // Not before (timestamp in seconds)
    name?: string | null;            // Full name
    picture?: string | null;         // Profile picture URL
    given_name: string ;      // First name
    family_name?: string | null;     // Last name
    iat?: string | null;             // Issued at (timestamp in seconds)
    exp?: string | null;             // Expiration time (timestamp in seconds)
    jti?: string | null;             // JWT ID
    alg?: string | null;             // Algorithm used
    kid?: string | null;             // Key ID
    typ?: string | null;             // Type of token
  }
  
const queries = {
    verifyGoogleToken : async(parent  : any , {token  }  : {token : string} )=>{

        try {
            const googleToken = token ; 
            const googleAuthUrl = new URL("https://oauth2.googleapis.com/tokeninfo")
            googleAuthUrl.searchParams.set("id_token"  , googleToken)
 
            const {data}   = await axios.get<GoogleJWT>(googleAuthUrl.toString() , {
                responseType : "json"
            })
            const chekForuser = await UserService.getUserByEmail(data.email)

            if(!chekForuser){
              const user = await UserService.CreateUser({email : data.email , given_name : data.given_name , family_name : data.family_name ,picture  :  data.picture})
            }

            const userinDb = await UserService.getUserByEmail(data.email)
            if(!userinDb) throw new Error("user is not found")
            const resolvedToken = JWTService.generateTokenForUser(userinDb)
            return resolvedToken  ; 
            
        } catch (error) {
            console.log(error)
            return ""
            
        }
          
    },
    getCurrentUser : async(parent : any , args : any , ctx :Grapqhlcontext )=>{
        if(!ctx.user )return null 
        const user = await  UserService.getuserById(ctx.user.id)
        return user ; 
    },
    getUserById : async(parent : any , {id } : {id : string}  , ctx : Grapqhlcontext)=>{
          const user = await UserService.getuserById(id)
          return user  ;  
    }
}

export const mutations = {
    followUser  : async(parent : any , {to }  : {to : string}  , ctx : Grapqhlcontext)  => {
            if(!ctx.user || !ctx.user.id) throw new Error("UnAuthorized")

            await UserService.followUser(ctx.user.id , to )
            await redisclient.del(`RECOMMENDED_USERS:${ctx.user.id}`)
            return true ; 
    },

    unfollowUser  : async(parent : any , {to }  : {to : string}  , ctx : Grapqhlcontext)  => {
        if(!ctx.user || !ctx.user.id) throw new Error("UnAuthorized")

        await UserService.unFollowUser(ctx.user.id , to )
        await redisclient.del(`RECOMMENDED_USERS:${ctx.user.id}`)

        return true ; 
}
}


export const extraResolvers = {
    User  : {
        tweets  : (parent : User )=> prismaClient.tweet.findMany({where : {authorId : parent.id}}),

        followers : async(parent : User )=>{
            
            const users = await prismaClient.follows.findMany({where : {following : {id : parent.id}}  , include : {
                follower : true , 
                following : true }
            })
         
            return users.map(e=> e.follower)
    
    },
        following  : async(parent : User)=>{
            const users = await prismaClient.follows.findMany({where : {follower : {id : parent.id}}  , include : {
                follower : true , 
                following : true }
            })
            return users.map(e=> e.following)
       
        }  , 
        recommendedUser : async(parent : User , _ : any , ctx : Grapqhlcontext)=>{
            if(!ctx.user)  return []  ; 
            const cachedValue  = await redisclient.get(`RECOMMENDED_USERS:${ctx.user.id}`)
            
            if(cachedValue)  return JSON.parse(cachedValue)

            const myFollowing = await prismaClient.follows.findMany({
                where : {
                    follower : {id : ctx.user.id}
                }  , 
                include : {
                   following : {include : {followers : {include : {following  : true}}}}
                }
            })
           
            let users  : User[]   =[]
   
            for(const followers of myFollowing){
                followers.following.followers.map((ele)=>{
                    const index = myFollowing.findIndex(e=> e.followingId == ele.following.id)
                    
                    if( index   < 0 ) {
                        users.push(ele.following)
                    }
                   
                
                })
            }

            await redisclient.set(`RECOMMENDED_USERS:${ctx.user.id}`  , JSON.stringify(users))

            return users

        }
    }
}

export const  resolvers = {queries  , extraResolvers  , mutations}  ; 