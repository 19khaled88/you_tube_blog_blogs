import axios from "axios";
import { sql } from "../utils/db.js";
import TryCatch from "../utils/TryCatch.js";
import { getCache, setCahce } from "../redis/redis.cache.js";


export const getAllBlogs = TryCatch(async (req, res) => {
    const { searchQuery = "", category = "" } = req.query;


    // --------------------------
    // CHECK REDIS CACHE
    // --------------------------
    const cacheKey = `blogs:${searchQuery}:${category}`;
    const cached = await getCache(cacheKey)

    if (cached) {
        console.log("Serving from redis cache");
        return res.status(200).json({
            success: true,
            message: "Blogs fetched successfully (cache)",
            data: cached
        });
    }

    // --------------------------
    // BUILD QUERY
    // --------------------------
    let blogs;

    if (searchQuery && category) {
        blogs = await sql`SELECT * FROM blogs WHERE (title ILIKE ${'%' + searchQuery + '%'
            } OR description ILIKE ${'%' + searchQuery + '%'
            }) AND category = ${category} ORDER BY created_at DESC`;
    } else if (searchQuery) {
        blogs = await sql`SELECT * FROM blogs WHERE (title ILIKE ${'%' + searchQuery + '%'
            } OR description ILIKE ${'%' + searchQuery + '%'
            }) ORDER BY created_at DESC`;
    } else if (category) {
        blogs = await sql`SELECT * FROM blogs WHERE category =${category} ORDER BY created_at DESC`;
    } else {
        blogs = await sql`SELECT * FROM blogs ORDER BY created_at DESC`;
    }

    console.log('Serviing from db')


    // --------------------------
    // STORE IN CACHE FOR 1 HOUR
    // --------------------------
    await setCahce(cacheKey, blogs, 3600)

    return res.status(200).json({
        success: true,
        message: "Blogs fetched successfully",
        data: blogs
    });
});


export const getSingleBlog = TryCatch(async (req, res) => {
    const { id } = req.params;

    // --------------------------
    // CHECK REDIS CACHE
    // --------------------------
    const cacheKey = `blog:${id}`
    const cached = await getCache(cacheKey);

    if (cached) {
        console.log('Serviing from Redis cache');
        return res.status(200).json({
            success: true,
            message: 'Blog fetched successfully (cache)',
            ...cached
        });

    }

    // --------------------------
    // FETCH BLOG FROM DATABASE
    // --------------------------
    const blog = await sql`SELECT * FROM blogs WHERE id = ${id};`;
    if (blog.length === 0) {
        return res.status(404).json({
            success: false,
            message: "Blog not found"
        });
    }


    if (!blog[0]) {
        return res.status(404).json({
            success: false,
            message: "Blog not found"
        });
    }

    // --------------------------
    // FETCH AUTHOR FROM USER SERVICE
    // --------------------------
    const { data } = await axios.get(`${process.env.USER_SERVICE_URL}/api/v1/user/${blog[0].author}`);

    const responseData = { success: true, message: "Blog fetched successfully", blog: blog[0], author: data }

    // --------------------------
    // SAVE TO CACHE FOR 1 HOUR
    // --------------------------
    await setCahce(cacheKey, responseData, 3600)

    res.status(200).json(responseData);
});
