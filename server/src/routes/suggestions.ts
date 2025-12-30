import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest, authorize } from '../middleware/auth.js';
import { UserRole } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get all suggestions
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { status, category, userId } = req.query;
    const where: any = { isActive: true };

    if (status && status !== 'all') {
      where.status = status;
    }
    if (category && category !== 'all') {
      where.category = category;
    }
    if (userId) {
      where.userId = userId;
    }

    const suggestions = await prisma.suggestion.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            department: true,
          },
        },
        _count: {
          select: {
            comments: true,
            votes: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get user votes
    const currentUserId = req.user!.id;
    const userVotes = await prisma.suggestionVote.findMany({
      where: { userId: currentUserId },
      select: { suggestionId: true, voteType: true },
    });
    const voteMap = new Map(userVotes.map((v) => [v.suggestionId, v.voteType]));

    // Get vote counts
    const suggestionsWithVotes = await Promise.all(
      suggestions.map(async (suggestion) => {
        const votes = await prisma.suggestionVote.findMany({
          where: { suggestionId: suggestion.id },
        });
        const upvotes = votes.filter((v) => v.voteType === 'upvote').length;
        const downvotes = votes.filter((v) => v.voteType === 'downvote').length;

        return {
          ...suggestion,
          upvotes,
          downvotes,
          userVote: voteMap.get(suggestion.id) || null,
          commentCount: suggestion._count.comments,
        };
      })
    );

    res.json({ suggestions: suggestionsWithVotes });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get single suggestion
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const suggestion = await prisma.suggestion.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            department: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            replies: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!suggestion) {
      return res.status(404).json({ message: 'Suggestion not found' });
    }

    const votes = await prisma.suggestionVote.findMany({
      where: { suggestionId: id },
    });
    const upvotes = votes.filter((v) => v.voteType === 'upvote').length;
    const downvotes = votes.filter((v) => v.voteType === 'downvote').length;

    const userVote = await prisma.suggestionVote.findUnique({
      where: {
        suggestionId_userId: {
          suggestionId: id,
          userId,
        },
      },
    });

    res.json({
      suggestion: {
        ...suggestion,
        upvotes,
        downvotes,
        userVote: userVote?.voteType || null,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Create suggestion
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { title, description, category, priority } = req.body;

    const suggestion = await prisma.suggestion.create({
      data: {
        userId,
        title,
        description,
        category,
        priority,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({ suggestion });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Vote on suggestion
router.post('/:id/vote', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { voteType } = req.body; // 'upvote' or 'downvote'

    if (!['upvote', 'downvote'].includes(voteType)) {
      return res.status(400).json({ message: 'Invalid vote type' });
    }

    const existingVote = await prisma.suggestionVote.findUnique({
      where: {
        suggestionId_userId: {
          suggestionId: id,
          userId,
        },
      },
    });

    let vote;
    if (existingVote) {
      if (existingVote.voteType === voteType) {
        // Remove vote if clicking same vote type
        await prisma.suggestionVote.delete({
          where: { id: existingVote.id },
        });
        vote = null;
      } else {
        // Update vote
        vote = await prisma.suggestionVote.update({
          where: { id: existingVote.id },
          data: { voteType },
        });
      }
    } else {
      // Create new vote
      vote = await prisma.suggestionVote.create({
        data: {
          suggestionId: id,
          userId,
          voteType,
        },
      });
    }

    res.json({ vote });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Admin routes
router.use(authorize(UserRole.ADMIN, UserRole.COUNTRY_DIRECTOR, UserRole.DEPARTMENT_HEAD));

// Update suggestion status
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { status, priority, adminNotes } = req.body;

    const updateData: any = {};
    if (status !== undefined) {
      updateData.status = status;
      updateData.reviewedBy = userId;
      updateData.reviewedAt = new Date();
    }
    if (priority !== undefined) updateData.priority = priority;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;

    const suggestion = await prisma.suggestion.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    res.json({ suggestion });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Delete suggestion
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    await prisma.suggestion.update({
      where: { id },
      data: { isActive: false },
    });
    res.json({ message: 'Suggestion deleted' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

