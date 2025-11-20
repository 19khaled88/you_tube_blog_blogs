import express, { type Request, type Response } from 'express';
import dotenv from 'dotenv';
import blogRoutes from './routes/blog.js';
import { connectRedis } from './redis/redis.client.js';



dotenv.config();    



const app = express();
app.use(express.json());

// redist connection establish
(async()=>{
  // Connect Redis on startup
  await connectRedis();

})

app.get('/', (req: Request, res:Response) => {
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