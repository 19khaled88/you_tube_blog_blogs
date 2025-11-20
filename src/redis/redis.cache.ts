// src/redis/redis.cache.ts
import redisClient, { connectRedis } from "./redis.client.js"


export const setCahce = async(
    key:string,
    value:any,
    ttlLnSeconds?:number
)=>{
    try {
        await connectRedis();
        const data = JSON.stringify(value);
    
        if(ttlLnSeconds){
            await redisClient.set(key,data,{EX:ttlLnSeconds});
        }else{
            await redisClient.set(key,data);
        }
        
    } catch (error) {
       throw error 
    }
    

}

export const getCache = async <T>(key:string):Promise<T | null>=>{
    try {
        await connectRedis();
        const value = await redisClient.get(key);

        return value ? (JSON.parse(value) as T) : null;
    } catch (error) {
        return null
    }
}

export const deleteCache = async(key:string):Promise<void>=>{
    try {
        await connectRedis();
        await redisClient.del(key);
        
    } catch (error) {
        throw error;
    }
}