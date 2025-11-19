import { sql } from "../utils/db.js";
import TryCatch from "../utils/TryCatch.js";


export const getAllBlogs = TryCatch(async(req,res)=>{
    
    let blogs;

    blogs = sql`SELECT * FROM blogs ORDER BY created_at DESC`;

    res.status(200).json({
        message:"Blogs fetched successfully",
        data:blogs
    });
});   