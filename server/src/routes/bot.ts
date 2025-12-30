import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Extract keywords from a question for better matching
 */
function extractKeywords(question: string): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can', 'what', 'where', 'when',
    'who', 'why', 'how', 'which', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she',
    'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its',
    'our', 'their', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
    'up', 'down', 'out', 'off', 'over', 'under', 'again', 'further', 'then', 'once'
  ]);

  return question
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));
}

/**
 * Calculate similarity score between two strings
 */
function calculateSimilarity(str1: string, str2: string): number {
  const words1 = new Set(str1.toLowerCase().split(/\s+/));
  const words2 = new Set(str2.toLowerCase().split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

/**
 * Smart search across platform content
 */
async function smartPlatformSearch(question: string, userId: string) {
  const keywords = extractKeywords(question);
  const questionLower = question.toLowerCase();
  const results: any[] = [];

  try {
    // Search policies
    const policies = await prisma.policy.findMany({
      where: { isActive: true },
      select: {
        id: true,
        title: true,
        brief: true,
        category: true,
        tags: true,
      },
    });

    for (const policy of policies) {
      let score = 0;
      const titleLower = policy.title.toLowerCase();
      const briefLower = (policy.brief || '').toLowerCase();
      
      // Exact matches
      if (titleLower.includes(questionLower) || questionLower.includes(titleLower)) {
        score += 10;
      }
      if (briefLower.includes(questionLower)) {
        score += 5;
      }
      
      // Keyword matches
      for (const keyword of keywords) {
        if (titleLower.includes(keyword)) score += 3;
        if (briefLower.includes(keyword)) score += 2;
        if (policy.tags?.includes(keyword)) score += 2;
        if (policy.category?.toLowerCase().includes(keyword)) score += 1;
      }
      
      // Similarity score
      score += calculateSimilarity(question, policy.title) * 5;
      score += calculateSimilarity(question, briefLower) * 3;
      
      if (score > 0) {
        results.push({ ...policy, type: 'policy', score });
      }
    }
  } catch (error) {
    console.error('Error searching policies:', error);
  }

  try {
    // Search trainings
    const trainings = await prisma.training.findMany({
    where: { isActive: true },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      tags: true,
      isMandatory: true,
      courseType: true,
    },
    include: {
      completions: {
        where: { userId },
        take: 1,
        select: { status: true, progress: true, score: true, expiresAt: true },
      },
    },
  });

    for (const training of trainings) {
      let score = 0;
      const titleLower = training.title.toLowerCase();
      const descLower = (training.description || '').toLowerCase();
      
      // Exact matches
      if (titleLower.includes(questionLower) || questionLower.includes(titleLower)) {
        score += 10;
      }
      if (descLower.includes(questionLower)) {
        score += 5;
      }
      
      // Keyword matches
      for (const keyword of keywords) {
        if (titleLower.includes(keyword)) score += 3;
        if (descLower.includes(keyword)) score += 2;
        if (training.tags?.includes(keyword)) score += 2;
        if (training.category?.toLowerCase().includes(keyword)) score += 1;
      }
      
      // Similarity score
      score += calculateSimilarity(question, training.title) * 5;
      score += calculateSimilarity(question, descLower) * 3;
      
      if (score > 0) {
        results.push({ ...training, type: 'training', score, completion: training.completions?.[0] });
      }
    }
  } catch (error) {
    console.error('Error searching trainings:', error);
  }

  try {
    // Search library resources
    const libraryResources = await prisma.libraryResource.findMany({
      where: { isActive: true },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        tags: true,
      },
    });

    for (const resource of libraryResources) {
      let score = 0;
      const titleLower = resource.title.toLowerCase();
      const descLower = (resource.description || '').toLowerCase();
      
      for (const keyword of keywords) {
        if (titleLower.includes(keyword)) score += 3;
        if (descLower.includes(keyword)) score += 2;
        if (resource.tags?.includes(keyword)) score += 2;
      }
      
      if (score > 0) {
        results.push({ ...resource, type: 'library', score });
      }
    }
  } catch (error) {
    console.error('Error searching library resources:', error);
  }

  // Sort by score
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 5); // Top 5 results
}

/**
 * Generate intelligent answer from platform content
 */
async function generateSmartAnswer(question: string, userId: string): Promise<string> {
  const questionLower = question.toLowerCase();
  const keywords = extractKeywords(question);
  
  // Detect question intent
  const isTrainingQuery = keywords.some(k => 
    ['training', 'course', 'learn', 'certificate', 'certification', 'academy', 'mandatory', 'expire', 'expiry'].includes(k)
  );
  const isPolicyQuery = keywords.some(k => 
    ['policy', 'procedure', 'rule', 'guideline', 'regulation'].includes(k)
  );
  const isNavigationQuery = keywords.some(k => 
    ['where', 'how', 'find', 'access', 'get', 'download', 'view'].includes(k)
  );
  const isCertificateQuery = questionLower.includes('certificate') || questionLower.includes('certification');

  // Search platform content
  const searchResults = await smartPlatformSearch(question, userId);
  
  if (searchResults.length === 0) {
    return "I couldn't find specific information about that in the platform. Please check the Policies, Training, or Library tabs, or contact your supervisor for assistance.";
  }

  // Build answer from search results
  let answer = '';
  const topResult = searchResults[0];
  
  if (topResult.type === 'training') {
    answer = `📚 **${topResult.title}**\n\n`;
    
    if (topResult.description) {
      answer += `${topResult.description}\n\n`;
    }
    
    if (topResult.isMandatory) {
      answer += `⚠️ This is a **mandatory** course.\n\n`;
    }
    
    if (topResult.completion) {
      if (topResult.completion.status === 'COMPLETED') {
        answer += `✅ You have completed this course. `;
        if (topResult.completion.score !== null) {
          answer += `Your score: ${topResult.completion.score}%.\n\n`;
        }
        if (topResult.completion.expiresAt) {
          const daysUntilExpiry = Math.ceil((topResult.completion.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          if (daysUntilExpiry > 0) {
            answer += `📅 Certificate expires in ${daysUntilExpiry} days.`;
          } else {
            answer += `⚠️ Your certificate has expired. Please recertify.`;
          }
        }
      } else if (topResult.completion.status === 'IN_PROGRESS') {
        answer += `🔄 You are currently taking this course (${topResult.completion.progress}% complete). Continue in the Training tab.`;
      }
    } else {
      answer += `📖 This course is available in the **Training** tab. `;
      if (topResult.isMandatory) {
        answer += `Since it's mandatory, please complete it soon.`;
      }
    }
    
    answer += `\n\n📍 Go to: Training tab → Find "${topResult.title}"`;
    
  } else if (topResult.type === 'policy') {
    answer = `📋 **${topResult.title}**\n\n`;
    answer += `${topResult.brief || 'This policy is available in the Policies tab.'}\n\n`;
    answer += `📍 Go to: Policies tab → Find "${topResult.title}"`;
    
  } else if (topResult.type === 'library') {
    answer = `📖 **${topResult.title}**\n\n`;
    if (topResult.description) {
      answer += `${topResult.description}\n\n`;
    }
    answer += `📍 Go to: Library tab → Find "${topResult.title}"`;
  }

  // Add additional relevant results
  if (searchResults.length > 1) {
    answer += `\n\n💡 **Other relevant results:**\n`;
    for (let i = 1; i < Math.min(searchResults.length, 4); i++) {
      const result = searchResults[i];
      answer += `\n• ${result.type === 'training' ? '📚' : result.type === 'policy' ? '📋' : '📖'} ${result.title}`;
    }
  }

  // Handle specific question patterns
  if (isCertificateQuery) {
    const certificates = await prisma.certificate.findMany({
      where: { userId },
      include: {
        training: {
          select: { title: true },
        },
      },
      orderBy: { completionDate: 'desc' },
      take: 5,
    });

    if (certificates.length > 0) {
      answer = `📜 You have ${certificates.length} certificate(s):\n\n`;
      certificates.forEach((cert, idx) => {
        answer += `${idx + 1}. ${cert.courseTitle} - Completed ${cert.completionDate.toLocaleDateString()}\n`;
        if (cert.expiryDate) {
          const daysUntilExpiry = Math.ceil((cert.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          if (daysUntilExpiry > 0) {
            answer += `   Expires in ${daysUntilExpiry} days\n`;
          } else {
            answer += `   ⚠️ Expired\n`;
          }
        }
      });
      answer += `\n📍 View all certificates in the Training tab.`;
    }
  }

  // Navigation help
  if (isNavigationQuery) {
    if (questionLower.includes('training') || questionLower.includes('course')) {
      answer += `\n\n💡 **How to access trainings:**\n`;
      answer += `1. Go to the **Training** tab (INARA Academy)\n`;
      answer += `2. Browse available courses or use filters\n`;
      answer += `3. Click on a course to start learning\n`;
    } else if (questionLower.includes('policy')) {
      answer += `\n\n💡 **How to access policies:**\n`;
      answer += `1. Go to the **Policies** tab\n`;
      answer += `2. Browse by category or search\n`;
      answer += `3. Click on a policy to read details\n`;
    }
  }

  return answer;
}

// Ask INARA Bot (Smart Platform-Aware Bot)
router.post('/ask', authenticate, async (req: AuthRequest, res) => {
  try {
    const { question } = req.body;
    const userId = req.userId!;

    if (!question) {
      return res.status(400).json({ message: 'Question is required' });
    }

    const questionLower = question.toLowerCase();
    let answer = '';
    let sourceType = 'platform';
    let sourceId: string | null = null;
    let isSensitive = false;

    // Check for sensitive queries
    const sensitiveKeywords = ['safeguarding', 'complaint', 'harassment', 'abuse', 'violation', 'discrimination'];
    isSensitive = sensitiveKeywords.some(keyword => questionLower.includes(keyword));

    // Generate smart answer from platform content
    try {
      answer = await generateSmartAnswer(question, userId);
      
      // Get source ID from top result if available
      const searchResults = await smartPlatformSearch(question, userId);
      if (searchResults.length > 0) {
        sourceId = searchResults[0].id;
        sourceType = searchResults[0].type;
      }
      
      // Add sensitive warning if needed
      if (isSensitive) {
        answer += '\n\n⚠️ For sensitive matters, please contact your supervisor or use the official reporting channels immediately.';
      }

      console.log('✅ Smart platform-based answer generated');
    } catch (error: any) {
      console.error('Error generating smart answer:', error);
      console.error('Error stack:', error.stack);
      
      // Provide a more helpful fallback answer
      answer = `I encountered an issue while searching the platform. Here are some ways to find what you need:\n\n`;
      answer += `📚 **Trainings:** Go to the Training tab to browse all available courses\n`;
      answer += `📋 **Policies:** Go to the Policies tab to view all policies\n`;
      answer += `📖 **Library:** Go to the Library tab to access resources\n\n`;
      answer += `You can also try rephrasing your question or contact your supervisor for assistance.`;
      sourceType = 'error';
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'bot_query',
        resourceType: 'bot',
        details: { question, sourceType, usedAI: false },
      },
    });

    res.json({
      answer,
      sourceType,
      sourceId,
      isSensitive,
    });
  } catch (error: any) {
    console.error('Bot error:', error);
    res.status(500).json({ message: error.message || 'An error occurred while processing your question.' });
  }
});

export default router;
