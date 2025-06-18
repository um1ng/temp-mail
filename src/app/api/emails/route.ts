import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { GetEmailsRequest, GetEmailsResponse } from '@/types/email';
import { z } from 'zod';

const getEmailsSchema = z.object({
  emailAddressId: z.string(),
  page: z.number().min(1).optional().default(1),
  limit: z.number().min(1).max(100).optional().default(20),
  unreadOnly: z.boolean().optional().default(false),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = {
      emailAddressId: searchParams.get('emailAddressId') || '',
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      unreadOnly: searchParams.get('unreadOnly') === 'true',
    };
    
    const { emailAddressId, page, limit, unreadOnly } = getEmailsSchema.parse(params);
    
    // 验证邮箱地址是否存在且有效
    const emailAddress = await db.emailAddress.findUnique({
      where: { id: emailAddressId },
    });
    
    if (!emailAddress || !emailAddress.isActive || emailAddress.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Email address not found or expired' },
        { status: 404 }
      );
    }
    
    const skip = (page - 1) * limit;
    
    // 构建查询条件
    const whereClause = {
      emailAddressId,
      ...(unreadOnly && { isRead: false }),
    };
    
    // 查询邮件
    const [emails, total] = await Promise.all([
      db.email.findMany({
        where: whereClause,
        orderBy: { receivedAt: 'desc' },
        skip,
        take: limit,
        include: {
          attachments: true,
        },
      }),
      db.email.count({
        where: whereClause,
      }),
    ]);
    
    const hasMore = skip + emails.length < total;
    
    const response: GetEmailsResponse = {
      emails,
      total,
      hasMore,
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching emails:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 