import express from 'express';
import { addComment, blogreaction, deleteComment, getAllBlogs, getAllComments, getBlogreaction, getSingleBlog, saveBlog, savedBlogs } from '../controller/blog.js';
import { isAuth } from '../middleware/isAuth.js';

const router = express.Router();

router.get('/singleBlog/:id', getSingleBlog);
router.get('/blog/all', getAllBlogs);

router.post('/comment/:id', isAuth, addComment);
router.get('/comments/:id', getAllComments);
router.delete('/commentDelete/:id/:userId',isAuth, deleteComment);

router.post('/save/:blogId',isAuth,saveBlog);
router.get('/saved/blogs',isAuth,savedBlogs);

router.post('/blog/:blogid/react',isAuth,blogreaction);
router.get('/blog/:blogid/reactions',getBlogreaction)

export default router;