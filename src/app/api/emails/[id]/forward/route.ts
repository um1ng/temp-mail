import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import nodemailer from 'nodemailer';
import { sanitizeHtmlContent, detectSensitiveInfo, maskSensitiveInfo } from '@/lib/security';

const forwardEmailSchema = z.object({
  toEmail: z.string().email(),
  message: z.string().optional(),
  includeOriginal: z.boolean().default(true),
  includeAttachments: z.boolean().default(false),
  scheduledAt: z.string().datetime().optional(),
  expireAfter: z.number().min(1).max(168).optional(), // hours
  password: z.string().min(6).optional(),
  maskSensitive: z.boolean().default(true),
  format: z.enum(['html', 'text']).default('text'),
});

// 配置邮件发送器
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: emailId } = await context.params;
    const body = await request.json();
    const { 
      toEmail, 
      message, 
      includeOriginal, 
      includeAttachments,
      scheduledAt,
      expireAfter,
      password,
      maskSensitive,
      format
    } = forwardEmailSchema.parse(body);

    // 获取原始邮件
    const originalEmail = await db.email.findUnique({
      where: { id: emailId },
      include: {
        emailAddress: true,
        attachments: true,
        shares: true,
      },
    });

    if (!originalEmail) {
      return NextResponse.json(
        { error: '邮件不存在' },
        { status: 404 }
      );
    }

    // 检查是否加密邮件
    if (originalEmail.isEncrypted) {
      return NextResponse.json(
        { error: '加密邮件无法直接转发，请先解密' },
        { status: 400 }
      );
    }

    // 安全检查 - 检测敏感信息
    let emailContent = originalEmail.textContent || originalEmail.htmlContent || '';
    if (maskSensitive) {
      const sensitiveMatches = detectSensitiveInfo(emailContent);
      if (sensitiveMatches.length > 0) {
        emailContent = maskSensitiveInfo(emailContent, sensitiveMatches);
      }
    }

    // 构建转发邮件内容
    let forwardContent = '';
    let forwardHtmlContent = '';
    
    if (message) {
      forwardContent += `${message}\n\n`;
      forwardHtmlContent += `<p>${message.replace(/\n/g, '<br>')}</p><br>`;
    }
    
    if (includeOriginal) {
      // 文本格式
      forwardContent += `---------- 转发邮件 ----------\n`;
      forwardContent += `发件人: ${originalEmail.fromAddress}\n`;
      forwardContent += `收件人: ${originalEmail.toAddress}\n`;
      forwardContent += `主题: ${originalEmail.subject || '(无主题)'}\n`;
      forwardContent += `时间: ${originalEmail.receivedAt.toLocaleString('zh-CN')}\n`;
      
      if (originalEmail.attachments.length > 0) {
        forwardContent += `附件: ${originalEmail.attachments.map(a => a.filename).join(', ')}\n`;
      }
      
      forwardContent += `\n${emailContent}`;

      // HTML格式
      forwardHtmlContent += `
        <div style="border-left: 4px solid #ccc; padding-left: 16px; margin: 20px 0;">
          <h3 style="color: #666;">转发邮件</h3>
          <table style="border-collapse: collapse; width: 100%;">
            <tr><td style="font-weight: bold; padding: 4px 8px;">发件人:</td><td style="padding: 4px 8px;">${originalEmail.fromAddress}</td></tr>
            <tr><td style="font-weight: bold; padding: 4px 8px;">收件人:</td><td style="padding: 4px 8px;">${originalEmail.toAddress}</td></tr>
            <tr><td style="font-weight: bold; padding: 4px 8px;">主题:</td><td style="padding: 4px 8px;">${originalEmail.subject || '(无主题)'}</td></tr>
            <tr><td style="font-weight: bold; padding: 4px 8px;">时间:</td><td style="padding: 4px 8px;">${originalEmail.receivedAt.toLocaleString('zh-CN')}</td></tr>
            ${originalEmail.attachments.length > 0 ? 
              `<tr><td style="font-weight: bold; padding: 4px 8px;">附件:</td><td style="padding: 4px 8px;">${originalEmail.attachments.map(a => a.filename).join(', ')}</td></tr>` 
              : ''
            }
          </table>
          <div style="margin-top: 16px; padding: 16px; background: #f9f9f9; border-radius: 4px;">
            ${originalEmail.htmlContent ? sanitizeHtmlContent(originalEmail.htmlContent) : emailContent.replace(/\n/g, '<br>')}
          </div>
        </div>
      `;
    }

    // 如果是定时转发，创建转发记录但不立即发送
    if (scheduledAt) {
      const scheduledForward = await db.emailForward.create({
        data: {
          emailId,
          toEmail,
          content: forwardContent,
          htmlContent: forwardHtmlContent,
          scheduledAt: new Date(scheduledAt),
          status: 'scheduled',
          includeAttachments,
          password,
          expireAfter,
        },
      });

      return NextResponse.json({
        success: true,
        message: '转发已安排',
        forwardId: scheduledForward.id,
        scheduledAt,
      });
    }

    // 准备邮件选项
    const mailOptions: Record<string, unknown> = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: toEmail,
      subject: `转发: ${originalEmail.subject || '(无主题)'}`,
      text: forwardContent,
    };

    if (format === 'html') {
      mailOptions.html = forwardHtmlContent;
    }

    // 处理附件
    if (includeAttachments && originalEmail.attachments.length > 0) {
      mailOptions.attachments = originalEmail.attachments.map(attachment => ({
        filename: attachment.filename,
        path: attachment.filePath,
        contentType: attachment.contentType,
      }));
    }

    // 发送邮件
    let emailInfo;
    try {
      emailInfo = await transporter.sendMail(mailOptions);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      return NextResponse.json(
        { error: '邮件发送失败，请稍后重试' },
        { status: 500 }
      );
    }

    // 记录转发操作
    const forwardRecord = await db.emailForward.create({
      data: {
        emailId,
        toEmail,
        content: forwardContent,
        htmlContent: format === 'html' ? forwardHtmlContent : null,
        sentAt: new Date(),
        status: 'sent',
        includeAttachments,
        messageId: emailInfo.messageId,
        expireAfter,
      },
    });

    // 更新邮件统计
    await db.email.update({
      where: { id: emailId },
      data: {
        forwardCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: '邮件转发成功',
      forwardId: forwardRecord.id,
      forwardTo: toEmail,
      messageId: emailInfo.messageId,
      maskedSensitive: maskSensitive,
    });

  } catch (error) {
    console.error('Error forwarding email:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '请求数据无效', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: '转发失败' },
      { status: 500 }
    );
  }
}

// 获取转发历史
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: emailId } = await context.params;
    
    const forwards = await db.emailForward.findMany({
      where: { emailId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        toEmail: true,
        sentAt: true,
        scheduledAt: true,
        status: true,
        includeAttachments: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      forwards,
    });

  } catch (error) {
    console.error('Error fetching forward history:', error);
    return NextResponse.json(
      { error: '获取转发历史失败' },
      { status: 500 }
    );
  }
}