import { RedisClient } from "bun";

const redisPub = new RedisClient(process.env.REDIS_URL);
const redisSub = redisPub.duplicate();

export { redisPub, redisSub };
