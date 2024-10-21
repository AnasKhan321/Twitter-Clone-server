import { Jwt } from "jsonwebtoken"

export interface JwtUser2{
    id : string , 
    email : string
}

export interface JWTUser{
    user : JwtUser2
}

export interface Grapqhlcontext{
    user? :  JwtUser2
}