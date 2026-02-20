import { Request, Response } from 'express';
import pool from '../config/db';
import { addPublishJob } from '../jobs/post.queue';
import { CreatePostInput, ApiResponse, Post, PostWithLogs } from '../types';

// ============================================
// Post Controller
// ============================================

/**
 * POST /api/posts
 * Create a new post and add it to the publishing queue
 */
export async function createPost(req: Request, res: Response): Promise<void> {
  try {
    const { title, content, image_url } = req.body as CreatePostInput;

    // Validation
    if (!title || !content) {
      res.status(400).json({
        success: false,
        message: 'Title and content are required',
      } as ApiResponse);
      return;
    }

    // Save post to database
    const result = await pool.query<Post>(
      `INSERT INTO posts (title, content, image_url, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING *`,
      [title, content, image_url || null]
    );

    const post = result.rows[0];

    // Add to publishing queue
    await addPublishJob(post.id);

    res.status(201).json({
      success: true,
      message: 'Post created & publishing started',
      data: post,
    } as ApiResponse<Post>);
  } catch (error: any) {
    console.error('❌ Create post error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to create post',
    } as ApiResponse);
  }
}

/**
 * GET /api/posts
 * Get all posts, ordered by creation date
 */
export async function getAllPosts(req: Request, res: Response): Promise<void> {
  try {
    const result = await pool.query<Post>(
      'SELECT * FROM posts ORDER BY created_at DESC'
    );

    res.json({
      success: true,
      data: result.rows,
    } as ApiResponse<Post[]>);
  } catch (error: any) {
    console.error('❌ Get all posts error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch posts',
    } as ApiResponse);
  }
}

/**
 * GET /api/posts/:id
 * Get a single post with its platform logs
 */
export async function getPostById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    // Get post
    const postResult = await pool.query<Post>(
      'SELECT * FROM posts WHERE id = $1',
      [id]
    );

    if (postResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Post not found',
      } as ApiResponse);
      return;
    }

    // Get logs
    const logsResult = await pool.query(
      'SELECT * FROM post_logs WHERE post_id = $1 ORDER BY created_at DESC',
      [id]
    );

    const postWithLogs: PostWithLogs = {
      ...postResult.rows[0],
      logs: logsResult.rows,
    };

    res.json({
      success: true,
      data: postWithLogs,
    } as ApiResponse<PostWithLogs>);
  } catch (error: any) {
    console.error('❌ Get post by ID error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch post',
    } as ApiResponse);
  }
}

/**
 * DELETE /api/posts/:id
 * Delete a post and its logs (CASCADE)
 */
export async function deletePost(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM posts WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Post not found',
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      message: 'Post deleted successfully',
    } as ApiResponse);
  } catch (error: any) {
    console.error('❌ Delete post error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to delete post',
    } as ApiResponse);
  }
}

/**
 * POST /api/posts/:id/retry
 * Retry publishing a failed post
 */
export async function retryPost(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    // Check post exists and is failed
    const postResult = await pool.query<Post>(
      'SELECT * FROM posts WHERE id = $1',
      [id]
    );

    if (postResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Post not found',
      } as ApiResponse);
      return;
    }

    const post = postResult.rows[0];

    if (post.status !== 'failed') {
      res.status(400).json({
        success: false,
        message: 'Only failed posts can be retried',
      } as ApiResponse);
      return;
    }

    // Reset status to pending
    await pool.query(
      "UPDATE posts SET status = 'pending', updated_at = NOW() WHERE id = $1",
      [id]
    );

    // Delete old logs for retry
    await pool.query('DELETE FROM post_logs WHERE post_id = $1', [id]);

    // Re-add to queue
    await addPublishJob(id);

    res.json({
      success: true,
      message: 'Post retry started',
    } as ApiResponse);
  } catch (error: any) {
    console.error('❌ Retry post error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retry post',
    } as ApiResponse);
  }
}
