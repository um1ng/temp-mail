"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { EmailLayout } from "@/components/email-layout";
import { EmailList } from "@/components/email-list";
import { EmailDetail } from "@/components/email-detail";

interface Email {
  id: string;
  from: string;
  to: string;
  subject: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
}

export default function Home() {
  const [currentEmail, setCurrentEmail] = useState<string>("");
  const [currentAddressId, setCurrentAddressId] = useState<string>("");
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // 生成随机邮箱地址
  const generateEmail = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expirationMinutes: 60 }),
      });
      
      if (!response.ok) throw new Error('Failed to generate email');
      
      const data = await response.json();
      setCurrentEmail(data.emailAddress.address);
      setCurrentAddressId(data.emailAddress.id);
      setEmails([]);
      setSelectedEmail(null);
      toast.success("新邮箱地址已生成");
    } catch (error) {
      console.error('Error generating email:', error);
      toast.error("生成邮箱地址失败");
    } finally {
      setIsLoading(false);
    }
  };

  // 复制邮箱地址
  const copyEmail = async () => {
    if (currentEmail) {
      await navigator.clipboard.writeText(currentEmail);
      toast.success("邮箱地址已复制到剪贴板");
    }
  };

  // 刷新邮件
  const refreshEmails = useCallback(async () => {
    if (!currentAddressId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/emails?emailAddressId=${currentAddressId}`);
      if (!response.ok) throw new Error('Failed to fetch emails');
      
      const data = await response.json();
      // 转换API返回的数据格式
      const formattedEmails: Email[] = data.emails.map((email: {
        id: string;
        fromAddress: string;
        subject?: string;
        textContent?: string;
        htmlContent?: string;
        receivedAt: string;
        isRead: boolean;
      }) => ({
        id: email.id,
        from: email.fromAddress,
        to: currentEmail,
        subject: email.subject || '(无主题)',
        content: email.textContent || email.htmlContent || '(无内容)',
        timestamp: new Date(email.receivedAt),
        isRead: email.isRead
      }));
      
      const previousCount = emails.length;
      setEmails(formattedEmails);
      setLastRefresh(new Date());
      
      if (formattedEmails.length > previousCount) {
        toast.success(`发现 ${formattedEmails.length - previousCount} 封新邮件！`);
      }
    } catch (error) {
      console.error('Error fetching emails:', error);
      toast.error("刷新邮件失败");
    } finally {
      setIsLoading(false);
    }
  }, [currentAddressId, emails.length, currentEmail]);

  // 删除邮件
  const deleteEmail = async (emailId: string) => {
    try {
      const response = await fetch(`/api/emails/${emailId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete email');
      
      setEmails(emails.filter(email => email.id !== emailId));
      if (selectedEmail?.id === emailId) {
        setSelectedEmail(null);
      }
      toast.success("邮件已删除");
    } catch (error) {
      console.error('Error deleting email:', error);
      toast.error("删除邮件失败");
    }
  };

  // 标记邮件为已读
  const markEmailAsRead = async (emailId: string) => {
    try {
      const response = await fetch(`/api/emails/${emailId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true }),
      });
      
      if (!response.ok) throw new Error('Failed to mark email as read');
      
      setEmails(emails.map(email => 
        email.id === emailId ? { ...email, isRead: true } : email
      ));
      
      if (selectedEmail?.id === emailId) {
        setSelectedEmail({ ...selectedEmail, isRead: true });
      }
    } catch (error) {
      console.error('Error marking email as read:', error);
      // 静默失败，不显示错误消息，因为这不是关键操作
    }
  };

  // 处理邮件选择
  const handleEmailSelect = (email: Email) => {
    setSelectedEmail(email);
    if (!email.isRead) {
      markEmailAsRead(email.id);
    }
  };

  // 发送测试邮件
  const sendTestEmail = async () => {
    if (!currentEmail) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/send-test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          to: currentEmail,
          subject: '欢迎使用临时邮箱服务',
          content: '这是一封测试邮件，用于验证您的临时邮箱是否正常工作。如果您能看到这条消息，说明邮件接收功能运行正常！'
        }),
      });
      
      if (!response.ok) throw new Error('Failed to send test email');
      
      toast.success("测试邮件已发送，请稍后刷新查看");
      // 3秒后自动刷新邮件
      setTimeout(() => {
        refreshEmails();
      }, 3000);
    } catch (error) {
      console.error('Error sending test email:', error);
      toast.error("发送测试邮件失败");
    } finally {
      setIsLoading(false);
    }
  };

  // 切换自动刷新
  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
    if (!autoRefresh) {
      toast.success("已开启自动刷新 (每10秒)");
    } else {
      toast.success("已关闭自动刷新");
    }
  };

  // 初始化时生成邮箱
  useEffect(() => {
    generateEmail();
  }, []);

  // 自动刷新邮件
  useEffect(() => {
    if (!autoRefresh || !currentAddressId || isLoading) return;

    const interval = setInterval(() => {
      refreshEmails();
    }, 10000); // 每10秒刷新一次

    return () => clearInterval(interval);
  }, [autoRefresh, currentAddressId, isLoading, refreshEmails]);

  const unreadCount = emails.filter(email => !email.isRead).length;

  return (
    <EmailLayout
      currentEmail={currentEmail}
      onGenerateEmail={generateEmail}
      onCopyEmail={copyEmail}
      onSendTestEmail={sendTestEmail}
      onRefreshEmails={refreshEmails}
      onToggleAutoRefresh={toggleAutoRefresh}
      autoRefresh={autoRefresh}
      lastRefresh={lastRefresh}
      unreadCount={unreadCount}
      totalCount={emails.length}
      isLoading={isLoading}
    >
      <div className="flex flex-1 overflow-hidden">
        {/* 邮件列表 */}
        <div className="w-1/3 min-w-0 border-r">
          <EmailList
            emails={emails}
            selectedEmailId={selectedEmail?.id}
            onEmailSelect={handleEmailSelect}
            onEmailDelete={deleteEmail}
            onEmailMarkRead={markEmailAsRead}
            isLoading={isLoading}
          />
        </div>
        
        {/* 邮件详情 */}
        <div className="flex-1 min-w-0">
          <EmailDetail
            email={selectedEmail}
            onBack={() => setSelectedEmail(null)}
            onDelete={deleteEmail}
            onReply={() => {
              toast.info("回复功能正在开发中");
            }}
            onReplyAll={() => {
              toast.info("全部回复功能正在开发中");
            }}
            onForward={() => {
              toast.info("转发功能正在开发中");
            }}
            onStar={() => {
              toast.info("星标功能正在开发中");
            }}
            onArchive={() => {
              toast.info("归档功能正在开发中");
            }}
          />
        </div>
      </div>
    </EmailLayout>
  );
}
