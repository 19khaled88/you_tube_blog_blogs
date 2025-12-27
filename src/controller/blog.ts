import axios from "axios";
import { sql } from "../utils/db.js";
import TryCatch from "../utils/TryCatch.js";
import { getCache, setCahce } from "../redis/redis.cache.js";
import type { AuthenticationRequest } from "../middleware/isAuth.js";

// const USER_SERVICE = process.env.USER_SERVICE_URL;

export const getAllBlogs = TryCatch(async (req, res) => {
  const { searchQuery = "", category = "" } = req.query;

  // --------------------------
  // CHECK REDIS CACHE
  // --------------------------
  const cacheKey = `blogs:${searchQuery}:${category}`;
  const cached = await getCache(cacheKey);

  if (cached) {
    console.log("Serving from redis cache");
    return res.status(200).json({
      success: true,
      message: "Blogs fetched successfully (cache)",
      data: cached,
    });
  }

  // --------------------------
  // BUILD QUERY
  // --------------------------
  let blogs;

  if (searchQuery && category) {
    blogs = await sql`SELECT * FROM blogs WHERE (title ILIKE ${
      "%" + searchQuery + "%"
    } OR description ILIKE ${
      "%" + searchQuery + "%"
    }) AND category = ${category} ORDER BY created_at DESC`;
  } else if (searchQuery) {
    blogs = await sql`SELECT * FROM blogs WHERE (title ILIKE ${
      "%" + searchQuery + "%"
    } OR description ILIKE ${
      "%" + searchQuery + "%"
    }) ORDER BY created_at DESC`;
  } else if (category) {
    blogs =
      await sql`SELECT * FROM blogs WHERE category =${category} ORDER BY created_at DESC`;
  } else {
    blogs = await sql`SELECT * FROM blogs ORDER BY created_at DESC`;
  }

  console.log("Serviing from db");

  // --------------------------
  // STORE IN CACHE FOR 1 HOUR
  // --------------------------
  await setCahce(cacheKey, blogs, 180);

  return res.status(200).json({
    success: true,
    message: "Blogs fetched successfully",
    data: blogs,
  });
});

export const getSingleBlog = TryCatch(async (req, res) => {
  const { id } = req.params;

  // --------------------------
  // CHECK REDIS CACHE
  // --------------------------
  const cacheKey = `blog:${id}`;
  const cached = await getCache(cacheKey);

  if (cached) {
    return res.status(200).json({
      success: true,
      message: "Blog fetched successfully (cache)",
      ...cached,
    });
  }
  // --------------------------
  // FETCH BLOG FROM DATABASE
  // --------------------------
  const blog = await sql`SELECT * FROM blogs WHERE id = ${id};`;

  if (!blog[0] || blog.length === 0) {
    return res.status(404).json({ success: false, message: "Blog not found" });
  }

  // --------------------------
  // FETCH AUTHOR FROM USER SERVICE
  // --------------------------

  let author = null;
  try {
    const { data } = await axios.get(
      `${process.env.USER_SERVICE_URL}/api/v1/user/${blog[0].author}`,
      { timeout: 5000 }
    );
    author = data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return res.status(error.response?.status || 500).json({
        success: false,
        message:
          error.response?.data?.message || "Failed to fetch author details",
      });
    }
  }

  const responseData = {
    success: true,
    message: "Blog fetched successfully",
    blog: blog[0],
    author,
  };

  // --------------------------
  // SAVE TO CACHE FOR 1 HOUR
  // --------------------------
  await setCahce(cacheKey, responseData, 180);

  res.status(200).json(responseData);
});

export const addComment = TryCatch(async (req: AuthenticationRequest, res) => {
  const { id: blogid } = req.params;
  const { comment,avatarImage } = req.body;

  await sql`INSERT INTO comments (comment, blogid, userid, username,avatar) VALUES (${comment},${blogid},${req.user?._id},${req.user?.name},${avatarImage}) RETURNING *`;

  res.json({
    message: "Comment Added",
  });
});

export const getAllComments = TryCatch(async (req, res) => {
  const { id } = req.params;

  // 1️⃣ Fetch comments from SQL
  const comments =
    await sql`SELECT * FROM comments WHERE blogid = ${id} ORDER BY created_at DESC`;

  // // 2️⃣ Extract unique userIds
  // const userIds = [...new Set(comments.map(c => c.userid))];

  //  // 3️⃣ Fetch users from user microservice (MongoDB)
  // const { data: users } = await axios.post(
  //   `${USER_SERVICE}/api/v1/users/bulk`,
  //   { ids: userIds }
  // );

  // // 4️⃣ Map users by id for quick lookup
  // const userMap = new Map(
  //   users.map((u: any) => [u._id.toString(), u])
  // );

  // 5️⃣ Merge user info into comments
  // const enrichedComments = comments.map(c => {
  //   const user = userMap.get(c.userid);
  //   return {
  //     ...c,
  //     username: user?.name || "Unknown",
  //     userImage: user?.image || null,
  //   };
  // });

  res.json({
    message: "Comments retrieved successfully",
    comments,
  });
});

export const deleteComment = TryCatch(
  async (req: AuthenticationRequest, res) => {
    const { id, userId } = req.params;

    
    const comment = await sql`SELECT * FROM comments WHERE id = ${id}`;

    console.log(comment,userId)
    if (!comment || comment === undefined) {
      res.json({
        message: "No comment found!",
      });
      return;
    }

    // if (comment[0] && comment[0].userid !== req.user?._id) {
    //   res.status(401).json({
    //     message: "You are not owner of this comment",
    //   });
    //   return;
    // }

    if(comment[0] && comment[0].userId !== userId){
      res.status(401).json({
        message:'You are not the owner of this comment'
      });
      return;
    }

    const isDelete = await sql`DELETE FROM comments WHERE id = ${id}`;
    if (isDelete) {
      res.json({
        message: "Comment Deleted",
      });
    } else {
      res.json({
        message: "Comment Deleted",
      });
    }
  }
);
