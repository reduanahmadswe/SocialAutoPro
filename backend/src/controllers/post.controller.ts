import { Request, Response } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '../config/db';
import { addPublishJob } from '../jobs/post.queue';
import { CreatePostInput, ApiResponse, Post, PostWithLogs, LinkedInTarget, PublishPlatform } from '../types';

// ============================================
// Post Controller
// ============================================

/**
 * POST /api/posts
 * Create a new post and add it to the publishing queue
 */
export async function createPost(req: Request, res: Response): Promise<void> {
  try {
    const { title, content, image_url, platforms, linkedin_target } = req.body as CreatePostInput;
    const selectedPlatforms: PublishPlatform[] = platforms && platforms.length > 0
      ? platforms
      : ['facebook', 'linkedin', 'telegram']; // default if not specified

    // Validation
    if (!title || !content) {
      res.status(400).json({
        success: false,
        message: 'Title and content are required',
      } as ApiResponse);
      return;
    }

    // Save post to database
    const [insertResult] = await pool.query<ResultSetHeader>(
      `INSERT INTO posts (id, title, content, image_url, status)
       VALUES (UUID(), ?, ?, ?, 'pending')`,
      [title, content, image_url || null]
    );

    // Fetch the newly created post
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM posts WHERE title = ? AND content = ? ORDER BY created_at DESC LIMIT 1',
      [title, content]
    );

    const post = rows[0] as Post;

    // Add to publishing queue
    await addPublishJob(post.id, selectedPlatforms);

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
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM posts ORDER BY created_at DESC'
    );

    res.json({
      success: true,
      data: rows as Post[],
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
    const [postRows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM posts WHERE id = ?',
      [id]
    );

    if (postRows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Post not found',
      } as ApiResponse);
      return;
    }

    // Get logs
    const [logRows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM post_logs WHERE post_id = ? ORDER BY created_at DESC',
      [id]
    );

    const postWithLogs: PostWithLogs = {
      ...(postRows[0] as Post),
      logs: logRows as any[],
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

    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM posts WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
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
    const [postRows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM posts WHERE id = ?',
      [id]
    );

    if (postRows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Post not found',
      } as ApiResponse);
      return;
    }

    const post = postRows[0] as Post;

    if (post.status !== 'failed') {
      res.status(400).json({
        success: false,
        message: 'Only failed posts can be retried',
      } as ApiResponse);
      return;
    }

    // Reset status to pending
    await pool.query(
      "UPDATE posts SET status = 'pending', updated_at = NOW() WHERE id = ?",
      [id]
    );

    // Delete old logs for retry
    await pool.query('DELETE FROM post_logs WHERE post_id = ?', [id]);

    // Re-add to queue
    const platforms: PublishPlatform[] = req.body?.platforms || ['facebook', 'linkedin', 'telegram'];
    await addPublishJob(id, platforms);

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
