import {PrismaClient}  from "@prisma/client"
import { query } from "express"

export const prismaClient = new PrismaClient({ log  : ["query"]})