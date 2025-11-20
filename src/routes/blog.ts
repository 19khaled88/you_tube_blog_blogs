import express from 'express';
import { getAllBlogs, getSingleBlog } from '../controller/blog.js';

const router = express.Router();

router.get('/singleBlog/:id', getSingleBlog);
router.get('/blog/all', getAllBlogs);

export default router;