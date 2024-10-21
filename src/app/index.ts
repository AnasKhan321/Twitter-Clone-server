
import { ApolloServer } from "@apollo/server"  ; 
import { expressMiddleware } from '@apollo/server/express4';
import cors from 'cors';
import express from 'express';
import {User}  from "./user"
import { Tweet } from "./tweet";
import { Grapqhlcontext } from "../interfaces";
import JWTService from "../services/jwtservices";
import 'dotenv/config'


export  async function initServer(){


    const app = express()

    const graphqlServer = new ApolloServer<Grapqhlcontext>({
        typeDefs  : `
        ${User.types}
        ${Tweet.types}
            type Query {
               
                    ${User.queries}
                    ${Tweet.queries}
                    

            }

            type Mutation {
            ${Tweet.mutation}
            ${User.mutations}
            }

        ` , 
        resolvers  : {
         
            Query : {
                ...User.resolvers.queries , 
                ...Tweet.resolvers.query
            } , 
            Mutation : {
                ...Tweet.resolvers.mutations , 
                ...User.resolvers.mutations
            }  , 
            ...Tweet.resolvers.extraResolvers , 
            ...User.resolvers.extraResolvers
        
        }
    })

    await graphqlServer.start()
    app.use(express.json())
    app.use(cors())
    app.use("/graphql"  , expressMiddleware(graphqlServer  , {context:
        async({req,res})=>{

            
                return {
                    user : req.headers.authorization ? JWTService.decodeToken(req.headers.authorization.split("Bearer ")[1]) : null
                }
        }
    })   )

    return app ; 
}