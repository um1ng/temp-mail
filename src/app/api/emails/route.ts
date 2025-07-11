import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { GetEmailsResponse } from '@/types/email';
import { z } from 'zod';

const getEmailsSchema = z.object({
  emailAddressId: z.string(),
  page: z.number().min(1).optional().default(1),
  limit: z.number().min(1).max(100).optional().default(20),
  unreadOnly: z.boolean().optional().default(false),
  filter: z.enum(['inbox', 'starred', 'archived', 'trash']).optional().default('inbox'),
  search: z.string().optional(),
  sender: z.string().optional(),
  hasAttachments: z.boolean().optional(),
  isRead: z.boolean().optional(),
  isStarred: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const emailAddressId = searchParams.get('emailAddressId');
    
    // 如果没有提供emailAddressId，返回错误
    if (!emailAddressId) {
      return NextResponse.json(
        { error: 'emailAddressId is required' },
        { status: 400 }
      );
    }

    const params = {
      emailAddressId,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      unreadOnly: searchParams.get('unreadOnly') === 'true',
      filter: searchParams.get('filter') || 'inbox',
      search: searchParams.get('search') || undefined,
      sender: searchParams.get('sender') || undefined,
      hasAttachments: searchParams.get('hasAttachments') === 'true' ? true : undefined,
      isRead: searchParams.get('isRead') === 'true' ? true : searchParams.get('isRead') === 'false' ? false : undefined,
      isStarred: searchParams.get('isStarred') === 'true' ? true : undefined,
    };
    
    // 验证参数
    const { 
      page, 
      limit, 
      unreadOnly, 
      filter, 
      search, 
      sender, 
      hasAttachments, 
      isRead, 
      isStarred 
    } = getEmailsSchema.parse(params);
    
    // 验证邮箱地址是否存在且有效
    const emailAddress = await db.emailAddress.findUnique({
      where: { id: emailAddressId },
    });
    
    if (!emailAddress) {
      return NextResponse.json(
        { error: 'Email address not found' },
        { status: 404 }
      );
    }

    if (!emailAddress.isActive || emailAddress.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Email address expired' },
        { status: 410 }
      );
    }
    
    const skip = (page - 1) * limit;
    
    // 构建基础查询条件
    const whereClause: Record<string, unknown> = {
      emailAddressId,
    };

    // 根据过滤器类型添加条件
    switch (filter) {
      case 'inbox':
        whereClause.isArchived = false;
        whereClause.isDeleted = false;
        break;
      case 'starred':
        whereClause.isStarred = true;
        whereClause.isDeleted = false;
        break;
      case 'archived':
        whereClause.isArchived = true;
        whereClause.isDeleted = false;
        break;
      case 'trash':
        whereClause.isDeleted = true;
        break;
    }

    // 添加其他筛选条件
    if (unreadOnly) {
      whereClause.isRead = false;
    }

    if (search) {
      whereClause.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { textContent: { contains: search, mode: 'insensitive' } },
        { htmlContent: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (sender) {
      whereClause.fromAddress = { contains: sender };
    }
    
    if (hasAttachments !== undefined) {
      whereClause.hasAttachments = hasAttachments;
    }
    
    if (isRead !== undefined) {
      whereClause.isRead = isRead;
    }
    
    if (isStarred !== undefined) {
      whereClause.isStarred = isStarred;
    }
    
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
    
    // 格式化邮件数据
    const formattedEmails = emails.map(email => ({
      ...email,
      subject: email.subject ?? undefined,
      textContent: email.textContent ?? undefined,
      htmlContent: email.htmlContent ?? undefined,
      category: email.category ?? undefined,
      verificationCode: email.verificationCode ?? undefined,
      attachments: email.attachments.map(att => ({
        ...att,
        contentType: att.contentType ?? undefined,
        size: att.size ?? undefined,
        filePath: att.filePath ?? undefined,
      })),
    }));
    
    const response: GetEmailsResponse = {
      emails: formattedEmails,
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
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 