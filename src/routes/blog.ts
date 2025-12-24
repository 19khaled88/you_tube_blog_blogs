import express from 'express';
import { addComment, deleteComment, getAllBlogs, getAllComments, getSingleBlog } from '../controller/blog.js';
import { isAuth } from '../middleware/isAuth.js';

const router = express.Router();

router.get('/singleBlog/:id', getSingleBlog);
router.get('/blog/all', getAllBlogs);

router.post('/comment/:id', isAuth, addComment);
router.get('/comments/:id', getAllComments);
router.delete('/commentDelete/:id',isAuth, deleteComment);

export default router;