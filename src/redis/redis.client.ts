// src/redis/redis/client.ts
import {createClient} from 'redis';

export const redisClient = createClient({
   url: process.env.REDIS_URL as string,
});

// log errors 
redisClient.on('error',(err)=>{
    console.error("❌ Redis Client Error:", err)
});

// safe connection 
export const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
      console.log("✅ Connected to Redis");
    }
  } catch (error) {
    console.error("❌ Redis connection failed:", error);
  }
};

export default redisClient