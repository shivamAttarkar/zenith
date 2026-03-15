import { RedisClient } from "bun";

const redisPub = new RedisClient(process.env.REDIS_URL);
const redisSub = await redisPub.duplicate();

export { redisPub, redisSub };
