import nodemailer from 'nodemailer';
import { db } from './db';

export interface EmailData {
  from: string;
  to: string;
  subject?: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
    size: number;
  }>;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '1025'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      } : undefined,
      // 忽略SSL证书验证（仅用于开发环境）
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  /**
   * 接收并保存邮件到数据库
   */
  async receiveEmail(emailData: EmailData): Promise<boolean> {
    try {
      // 查找目标邮箱地址
      const emailAddress = await db.emailAddress.findUnique({
        where: { 
          address: emailData.to, 
          isActive: true 
        },
      });

      if (!emailAddress) {
        console.log(`Email address ${emailData.to} not found`);
        return false;
      }

      // 检查邮箱是否已过期
      if (emailAddress.expiresAt < new Date()) {
        console.log(`Email address ${emailData.to} has expired`);
        // 可以选择将邮箱标记为不活跃
        await db.emailAddress.update({
          where: { id: emailAddress.id },
          data: { isActive: false }
        });
        return false;
      }

      // 保存邮件到数据库
      const email = await db.email.create({
        data: {
          emailAddressId: emailAddress.id,
          fromAddress: emailData.from,
          toAddress: emailData.to,
          subject: emailData.subject || '(无主题)',
          textContent: emailData.text,
          htmlContent: emailData.html,
          hasAttachments: emailData.attachments ? emailData.attachments.length > 0 : false,
        },
      });

      // 保存附件（如果有）
      if (emailData.attachments && emailData.attachments.length > 0) {
        const attachmentData = emailData.attachments.map(attachment => ({
          emailId: email.id,
          filename: attachment.filename,
          contentType: attachment.contentType,
          size: attachment.size,
          content: attachment.content,
        }));

        await db.attachment.createMany({
          data: attachmentData,
        });
      }

      console.log(`Email saved: ${email.id} for address ${emailData.to}`);
      return true;
    } catch (error) {
      console.error('Error receiving email:', error);
      return false;
    }
  }

  /**
   * 发送测试邮件
   */
  async sendTestEmail(to: string, subject: string = '测试邮件', content: string = '这是一封测试邮件'): Promise<boolean> {
    try {
      const fromEmail = process.env.SMTP_USER || process.env.FROM_EMAIL || 'noreply@tempmail.local';
      
      const mailOptions = {
        from: fromEmail,
        to,
        subject,
        text: content,
        html: `<p>${content}</p><p><small>发送时间: ${new Date().toLocaleString()}</small></p>`
      };
      
      // 1. 发送邮件到 SMTP 服务器
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Test email sent successfully:', info.messageId);
      
      // 2. 同时将邮件保存到数据库，这样前端可以立即显示
      const emailData = {
        from: fromEmail,
        to,
        subject,
        text: content,
        html: mailOptions.html
      };
      
      const saveResult = await this.receiveEmail(emailData);
      if (saveResult) {
        console.log('Test email also saved to database for immediate display');
      } else {
        console.log('Test email sent but could not save to database (recipient not found)');
      }
      
      return true;
    } catch (error) {
      console.error('Error sending test email:', error);
      return false;
    }
  }

  /**
   * 验证SMTP连接
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('SMTP connection verified successfully');
      return true;
    } catch (error) {
      console.error('SMTP connection verification failed:', error);
      return false;
    }
  }

  /**
   * 清理过期的邮箱地址和邮件
   */
  async cleanupExpiredEmails(): Promise<number> {
    try {
      // 获取所有过期的邮箱地址
      const expiredAddresses = await db.emailAddress.findMany({
        where: {
          OR: [
            { expiresAt: { lt: new Date() } },
            { isActive: false }
          ]
        },
        select: { id: true }
      });

      if (expiredAddresses.length === 0) {
        return 0;
      }

      const expiredIds = expiredAddresses.map(addr => addr.id);

      // 删除相关的附件
      await db.attachment.deleteMany({
        where: {
          email: {
            emailAddressId: { in: expiredIds }
          }
        }
      });

      // 删除相关的邮件
      await db.email.deleteMany({
        where: {
          emailAddressId: { in: expiredIds }
        }
      });

      // 删除过期的邮箱地址
      const deleteResult = await db.emailAddress.deleteMany({
        where: {
          id: { in: expiredIds }
        }
      });

      console.log(`Cleaned up ${deleteResult.count} expired email addresses`);
      return deleteResult.count;
    } catch (error) {
      console.error('Error cleaning up expired emails:', error);
      return 0;
    }
  }
}

export const emailService = new EmailService(); 