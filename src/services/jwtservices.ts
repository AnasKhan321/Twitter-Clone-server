import { User } from "@prisma/client";
import { prismaClient } from "../clients/db";
import JWT from "jsonwebtoken"
import { JwtUser2 } from "../interfaces";

const JWTSECRET  = "a7n8a6s0"
class JWTService {



    public static  generateTokenForUser (user : User){
     
        const payload  : JwtUser2= {
            id : user?.id , 
            email : user?.email
        }

        const token = JWT.sign(payload , JWTSECRET)
        return token ; 
    }

    public static decodeToken(token :string) {
        return JWT.verify(token , JWTSECRET)
    }
}

export default JWTService ; 