import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  link?: string,
  resourceType?: string,
  resourceId?: string
) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        link,
        resourceType,
        resourceId,
      },
    });
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}

export async function notifyTrainingAssigned(userId: string, trainingId: string, trainingTitle: string) {
  return createNotification(
    userId,
    'training',
    'New Training Assigned',
    `You have been assigned to complete: ${trainingTitle}`,
    `/training/${trainingId}`,
    'training',
    trainingId
  );
}

export async function notifyPolicyUpdate(userId: string, policyId: string, policyTitle: string) {
  return createNotification(
    userId,
    'policy',
    'Policy Updated',
    `Policy "${policyTitle}" has been updated and requires your acknowledgment`,
    `/policies/${policyId}`,
    'policy',
    policyId
  );
}

export async function notifyMarketSubmissionStatus(
  userId: string,
  submissionId: string,
  status: string,
  title: string
) {
  return createNotification(
    userId,
    'market',
    'Market Submission Update',
    `Your submission "${title}" status changed to: ${status}`,
    `/market`,
    'market',
    submissionId
  );
}

export async function notifyUserApproval(userId: string) {
  return createNotification(
    userId,
    'general',
    'Account Approved',
    'Your account has been approved. You can now access the platform.',
    '/'
  );
}

export async function notifyNewsPublished(userId: string, newsId: string, newsTitle: string) {
  return createNotification(
    userId,
    'news',
    'New Announcement',
    `New announcement: ${newsTitle}`,
    `/news`,
    'news',
    newsId
  );
}

