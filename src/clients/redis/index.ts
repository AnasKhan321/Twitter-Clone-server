import Redis from "ioredis"

export const redisclient = new Redis(process.env.REDIS_CLIENT_URL || "rediss://default:AanUAAIjcDE3NmM0OTExNTFlZGE0NjdjYjhiMWNkNjM5NGU2NGJhYXAxMA@relieved-glowworm-43476.upstash.io:6379" );

