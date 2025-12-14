import express, { type Request, type Response } from 'express';
import dotenv from 'dotenv';
import blogRoutes from './routes/blog.js';
import { connectRedis } from './redis/redis.client.js';
import { startCacheConsumer } from './utils/rabbitMQConsumer.js';
import cors from 'cors';


dotenv.config();



const app = express();

app.use(cors({
  origin: "https://you-tube-blog-web.vercel.app",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  credentials: true,
  allowedHeaders: "Content-Type, Authorization"
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Manual OPTIONS handler (required for Vercel)
// app.options("*", (req, res) => {
//   res.setHeader("Access-Control-Allow-Origin", "https://you-tube-blog-web.vercel.app");
//   res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
//   res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS");
//   res.status(200).end();
// });




// redis connection establish
// (async () => {})


// Connect Redis on startup
await connectRedis();

// RabbitMQ service 
await startCacheConsumer();



app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Blog Service is running successfully',
    data: '',
    success: true,
  });
});

app.use('/api/v1', blogRoutes)

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Blog Service is running on port ${PORT}`);
}); 