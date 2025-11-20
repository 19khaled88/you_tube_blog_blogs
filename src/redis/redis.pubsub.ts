// src/redis/redis.pubsub.ts 

import { createClient } from "redis";
import redisClient, { connectRedis } from "./redis.client.js"


// Publish message 
export const publishMessage = async (
    channel: string, message: any
) => {
    await connectRedis();
    const data = JSON.stringify(message);
    await redisClient.publish(channel, data);
};

// Subscribe to channel 
export const subscribChannel = async (
    channel: string,
    callback: (msg: any) => void
) => {
    const subscriber = createClient({
        url: process.env.REDIS_URL as string,
    });

    subscriber.on('error', (err) => console.log('Redis Subscriber Error:', err));

    await subscriber.connect();
    console.log(`📩 Subscribed to Redis channel: ${channel}`);
    
    await subscriber.subscribe(channel,(message)=>{
        callback(JSON.parse(message))
    });

    return subscriber; // return subscriber for cancel / unsubscribe

}