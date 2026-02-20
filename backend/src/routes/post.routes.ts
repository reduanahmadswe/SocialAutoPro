import { Router } from 'express';
import {
  createPost,
  getAllPosts,
  getPostById,
  deletePost,
  retryPost,
} from '../controllers/post.controller';

// ============================================
// Post Routes
// ============================================

const router = Router();

// Create a new post & start publishing
router.post('/', createPost);

// Get all posts
router.get('/', getAllPosts);

// Get single post with logs
router.get('/:id', getPostById);

// Delete a post
router.delete('/:id', deletePost);

// Retry a failed post
router.post('/:id/retry', retryPost);

export default router;
