import { RedisClient } from "bun";

const redisPub = new RedisClient(Bun.env.REDIS_URL);
const redisSub = await redisPub.duplicate();

export { redisPub, redisSub };
