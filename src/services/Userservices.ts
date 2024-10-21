import { User } from "@prisma/client";
import { prismaClient } from "../clients/db";



export interface UserData {
    email : string  , 
    given_name : string 
    family_name : string | null | undefined
    picture : string | null | undefined
}

export class UserService {


        public static  async  getuserById(id : string)  {
            const user = await prismaClient.user.findUnique({where : {id : id}})
            return user  
        }

        public static async getUserByEmail(email : string){
            const user = await prismaClient.user.findUnique({where :{email : email}})
            return user ; 
        }

        public static async CreateUser(data : UserData){
            const user = await prismaClient.user.create({
                data : {
                 email : data.email , 
                firstName : data.given_name , 
                lastName : data.family_name , 
                profileImageUrl : data.picture

                }
            })
            return user ; 
        }

        public static followUser(from : string , to : string){
            return prismaClient.follows.create({
                data : {
                    follower : {connect  : {id : from}}  ,
                    following : {connect : {id : to}}
                }
            })
        }

        public static unFollowUser(from  : string , to : string){
            return prismaClient.follows.delete({
                where : {followerId_followingId : {followerId : from  , 
                    followingId : to 
                } }
            })
        }
}