import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email-service';
import { z } from 'zod';

const sendTestEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().optional().default('测试邮件'),
  content: z.string().optional().default('这是一封测试邮件，用于验证邮箱服务是否正常工作。'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, content } = sendTestEmailSchema.parse(body);
    
    // 验证目标邮箱是否是我们系统中的临时邮箱
    const isOurDomain = process.env.ALLOWED_DOMAINS?.split(',').some(domain => 
      to.endsWith('@' + domain.trim())
    ) || false;
    
    if (!isOurDomain) {
      return NextResponse.json(
        { error: 'Can only send test emails to temporary email addresses' },
        { status: 400 }
      );
    }
    
    const success = await emailService.sendTestEmail(to, subject, content);
    
    if (success) {
      return NextResponse.json(
        { 
          message: 'Test email sent successfully',
          to,
          subject,
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: 'Failed to send test email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error sending test email:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 