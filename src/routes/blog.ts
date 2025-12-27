import express from 'express';
import { addComment, deleteComment, getAllBlogs, getAllComments, getSingleBlog, saveBlog, savedBlogs } from '../controller/blog.js';
import { isAuth } from '../middleware/isAuth.js';

const router = express.Router();

router.get('/singleBlog/:id', getSingleBlog);
router.get('/blog/all', getAllBlogs);

router.post('/comment/:id', isAuth, addComment);
router.get('/comments/:id', getAllComments);
router.delete('/commentDelete/:id/:userId',isAuth, deleteComment);

router.post('/save/:blogId',isAuth,saveBlog);
router.get('/saved/blogs',isAuth,savedBlogs)

export default router;