import { NextRequest, NextResponse } from 'next/server';
import { emailService, EmailData } from '@/lib/email-service';
import { z } from 'zod';

const receiveEmailSchema = z.object({
  from: z.string().email(),
  to: z.string().email(),
  subject: z.string().optional(),
  text: z.string().optional(),
  html: z.string().optional(),
  attachments: z.array(z.object({
    filename: z.string(),
    content: z.string(), // Base64 encoded
    contentType: z.string(),
    size: z.number(),
  })).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = receiveEmailSchema.parse(body);
    
    // 转换附件数据格式
    const emailData: EmailData = {
      from: validatedData.from,
      to: validatedData.to,
      subject: validatedData.subject,
      text: validatedData.text,
      html: validatedData.html,
      attachments: validatedData.attachments?.map(att => ({
        filename: att.filename,
        content: Buffer.from(att.content, 'base64'),
        contentType: att.contentType,
        size: att.size,
      })),
    };
    
    const success = await emailService.receiveEmail(emailData);
    
    if (success) {
      return NextResponse.json(
        { message: 'Email received successfully' },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: 'Email address not found or expired' },
        { status: 404 }
      );
    }
  } catch (err) {
    console.error('Error receiving email:', err);
    
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid email data', details: err.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET 请求用于健康检查
export async function GET() {
  try {
    const isConnected = await emailService.verifyConnection();
    return NextResponse.json({
      status: 'Email service is running',
      smtpConnected: isConnected,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Email service health check failed:', err);
    return NextResponse.json(
      { error: 'Email service unavailable' },
      { status: 503 }
    );
  }
} 