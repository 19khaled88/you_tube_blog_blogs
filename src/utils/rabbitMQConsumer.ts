import amqp, { type Channel } from 'amqplib'
import redisClient from '../redis/redis.client.js';
import { sql } from './db.js';

// let channel:amqp.Channel;

const queueName = "cache-invalidate";

interface CacheInvalidationMessage {
    action: string,
    keys: string[],
}


export const startCacheConsumer =async ()=>{
    try {
       const connection = await amqp.connect(process.env.AMQP_URL as string);
        const channel = await connection.createChannel();

        await channel.assertQueue(queueName, {durable:true});

        console.log("✅ Blog Service: Cache consumer started");

        for await (const msg of consumeAsync(channel,queueName)){
            try {
                const payload = JSON.parse(msg.content.toString()) as CacheInvalidationMessage;

                console.log("📥 Received:", payload);

                if(payload.action === 'invalidateCache'){
                    await handleInvalidation(payload.keys);
                }

                channel.ack(msg);
            } catch (error) {
                console.error("❌ Error processing message:", error);
                channel.nack(msg, false, true); // requeue message
            }
        }
    } catch (error) {
        console.error("❌ Failed to connect to RabbitMQ:", error);
    }


    //  try {
    //     const connection = await amqp.connect(process.env.AMQP_URL!)

    //     const channel = await connection.createChannel();

    //     const queueName = "cache-invalidate";

    //     await channel.assertQueue(queueName, {durable:true})

    //     console.log('Blog service cache consumer started');

    //     channel.consume(queueName, async(msg)=>{
    //         if(msg){
    //             try {
    //                 const content = JSON.parse(msg.content.toString()) as CacheInvalidationMessage
    //                 console.log('Blog service recieved cache invalidation message',content);

    //                 if(content.action === 'invalidateCache'){
    //                     for(const pattern of content.keys){
    //                         const keys = await redisClient.keys(pattern);

    //                         if(keys.length > 0){
    //                             await redisClient.del(keys);

    //                             console.log(`Blog service invalidated ${keys.length} cache keys matcing: ${pattern}`);
    //                         }

    //                         const category ='';
    //                         const searchQuery = '';

    //                         const cacheKeys = `blogs:${searchQuery}:${category}`;

    //                         const blogs = await sql`SELECT * FROM blogs ORDER BY created_at DESC`;

    //                         await redisClient.set(cacheKeys, JSON.stringify(blogs),{EX:3600});

    //                         console.log('Cache rebuilt with key :', cacheKeys)
    //                     }
    //                 }
    //                 channel.ack(msg)
    //             } catch (error) {
    //                 console.error('Error processing cache invalidation in blog service : ',error)

    //                 channel.nack(msg, false, true);
    //             }
    //         }
    //     })

    //     // await channel.assertQueue('emails')

    //     console.log('Connected to CloudMQ supported RabbitMQ');
    // } catch (error) {
    //     console.error('Failed to connect to RabbitMQ');
    // }





}

/** Convert channel.consume → async iterator */
function consumeAsync(channel: Channel, queue: string) {
    const asyncIterator = {
        next(): Promise<IteratorResult<any>> {
            return new Promise((resolve) => {
                channel.consume(
                    queue,
                    (msg) => {
                        if (msg) resolve({ value: msg, done: false });
                    },
                    { noAck: false }
                );
            });
        },
        [Symbol.asyncIterator]() {
            return this;
        },
    };

    return asyncIterator;
}


/** Handles cache invalidation + rebuild */
async function handleInvalidation(patterns: string[]) {
    for (const pattern of patterns) {
        const keys = await redisClient.keys(pattern);

        if (keys.length > 0) {
            await redisClient.del(keys);
            console.log(`🗑️ Deleted ${keys.length} cache keys matching "${pattern}"`);
        }
    }

    // Rebuild default blog cache
    const cacheKey = "blogs::"; // empty search + empty category

    const blogs = await sql`SELECT * FROM blogs ORDER BY created_at DESC`;
    await redisClient.set(cacheKey, JSON.stringify(blogs), { EX: 3600 });

    console.log("🔄 Cache rebuilt:", cacheKey);
}