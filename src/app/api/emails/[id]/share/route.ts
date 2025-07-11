import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { randomBytes } from 'crypto';

const shareEmailSchema = z.object({
  expirationHours: z.number().min(1).max(168).default(24), // 最长7天
  accessType: z.enum(['view', 'download']).default('view'),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: emailId } = await context.params;
    const body = await request.json();
    const { expirationHours, accessType } = shareEmailSchema.parse(body);

    // 检查邮件是否存在
    const email = await db.email.findUnique({
      where: { id: emailId },
    });

    if (!email) {
      return NextResponse.json(
        { error: '邮件不存在' },
        { status: 404 }
      );
    }

    // 生成分享token
    const shareToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + expirationHours * 60 * 60 * 1000);
    
    // 构建分享URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const shareUrl = `${baseUrl}/share/${shareToken}`;

    // 这里可以将分享信息存储到数据库
    // 目前只是模拟存储
    console.log('Generated share link:', {
      emailId,
      shareToken,
      expiresAt,
      accessType,
    });

    return NextResponse.json({
      success: true,
      shareUrl,
      shareToken,
      expiresAt,
      accessType,
    });
  } catch (error) {
    console.error('Error creating share link:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '请求数据无效', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: '创建分享链接失败' },
      { status: 500 }
    );
  }
}