"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { EmailLayout } from "@/components/email-layout";
import { EmailList } from "@/components/email-list";
import { EmailDetail } from "@/components/email-detail";
import { SmartClassification } from "@/components/smart-classification";
import { useBatchOperations } from "@/hooks/use-batch-operations";
import { useSecurity } from "@/hooks/use-security";
import type { SearchFilters } from "@/components/email-search";
import type { SecuritySettings } from "@/components/security-settings";

interface EmailAddress {
  id: string
  address: string
  createdAt: Date
  expiresAt: Date
  isActive: boolean
  renewalCount: number
  maxRenewals: number
  lastRenewalAt?: Date
  warningsSent: number
  autoRenewalEnabled: boolean
  customExpirationMinutes: number
}

interface Email {
  id: string;
  from: string;
  to: string;
  subject: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  isStarred?: boolean;
  isArchived?: boolean;
  isDeleted?: boolean;
  category?: string;
  tags?: string[];
  verificationCode?: string;
}

export default function Home() {
  const [currentEmail, setCurrentEmail] = useState<string>("");
  const [currentAddressId, setCurrentAddressId] = useState<string>("");
  const [currentEmailAddress, setCurrentEmailAddress] = useState<EmailAddress | null>(null);
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<'inbox' | 'starred' | 'archived' | 'trash'>('inbox');
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});
  const [newEmailNotifier, setNewEmailNotifier] = useState<((email: Email) => void) | null>(null);
  const [lastEmailCount, setLastEmailCount] = useState(0);

  // 防抖处理
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);

  // 批量操作相关
  const batchOperations = useBatchOperations();
  
  // 安全功能相关
  const security = useSecurity();

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
      setCurrentEmailAddress(data.emailAddress);
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

  // 防抖刷新邮件
  const debouncedRefreshEmails = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      refreshEmails();
    }, 300);
  }, []);

  // 刷新邮件列表
  const refreshEmails = useCallback(async () => {
    if (!currentAddressId || isRefreshingRef.current) return;
    
    isRefreshingRef.current = true;
    
    // 只设置加载状态
    setIsLoading(true);
    
    try {
      // 构建查询参数
      const queryParams = new URLSearchParams({
        emailAddressId: currentAddressId,
        filter: currentFilter,
      });

      // 添加搜索参数
      if (searchQuery) {
        queryParams.append('search', searchQuery);
      }

      // 添加筛选参数
      Object.entries(searchFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });

      const response = await fetch(`/api/emails?${queryParams.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch emails');
      
      const data = await response.json();
      const formattedEmails = data.emails.map((email: {
        id: string;
        fromAddress: string;
        toAddress: string;
        subject?: string;
        textContent?: string;
        htmlContent?: string;
        receivedAt: string;
        isRead: boolean;
        isStarred: boolean;
        isArchived: boolean;
        isDeleted: boolean;
      }) => {
        // 处理邮件内容安全
        const processedTextContent = email.textContent 
          ? security.processEmailText(email.textContent)
          : '';
        const processedHtmlContent = email.htmlContent 
          ? security.processEmailContent(email.htmlContent, true)
          : '';

        return {
          id: email.id,
          from: email.fromAddress,
          to: email.toAddress,
          subject: email.subject || "(无主题)",
          content: processedTextContent || processedHtmlContent || "(无内容)",
          timestamp: new Date(email.receivedAt),
          isRead: email.isRead,
          isStarred: email.isStarred,
          isArchived: email.isArchived,
          isDeleted: email.isDeleted,
        };
      });
      
      setEmails(formattedEmails);
      
      // 检查是否有新邮件并发送通知
      if (formattedEmails.length > lastEmailCount && lastEmailCount > 0 && newEmailNotifier) {
        const newEmails = formattedEmails.slice(0, formattedEmails.length - lastEmailCount);
        newEmails.forEach((email: Email) => {
          if (!email.isRead) {
            newEmailNotifier(email);
          }
        });
      }
      
      setLastEmailCount(formattedEmails.length);
    } catch (error) {
      console.error('Error fetching emails:', error);
      toast.error("获取邮件失败");
    } finally {
      setIsLoading(false);
      isRefreshingRef.current = false;
    }
  }, [currentAddressId, currentFilter, searchQuery, searchFilters, lastEmailCount, newEmailNotifier, security]);

  // 删除邮件
  const deleteEmail = async (emailId: string) => {
    try {
      const response = await fetch(`/api/emails/${emailId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDeleted: true }),
      });
      
      if (!response.ok) throw new Error('Failed to delete email');
      
      toast.success("邮件已移至垃圾箱");
      refreshEmails();
      if (selectedEmail?.id === emailId) {
        setSelectedEmail(null);
      }
    } catch (error) {
      console.error('Error deleting email:', error);
      toast.error("删除邮件失败");
    }
  };

  // 标记邮件为已读（乐观更新）
  const markEmailAsRead = async (emailId: string) => {
    // 乐观更新本地状态
    setEmails(prev => prev.map(email => 
      email.id === emailId ? { ...email, isRead: true } : email
    ));
    
    if (selectedEmail?.id === emailId) {
      setSelectedEmail(prev => prev ? { ...prev, isRead: true } : null);
    }
    
    try {
      const response = await fetch(`/api/emails/${emailId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true }),
      });
      
      if (!response.ok) throw new Error('Failed to mark email as read');
    } catch (error) {
      console.error('Error marking email as read:', error);
      // 回滚乐观更新
      setEmails(prev => prev.map(email => 
        email.id === emailId ? { ...email, isRead: false } : email
      ));
      
      if (selectedEmail?.id === emailId) {
        setSelectedEmail(prev => prev ? { ...prev, isRead: false } : null);
      }
      toast.error("标记邮件失败");
    }
  };

  // 星标邮件（乐观更新）
  const toggleEmailStar = async (emailId: string, isStarred: boolean) => {
    // 乐观更新本地状态
    setEmails(prev => prev.map(email => 
      email.id === emailId ? { ...email, isStarred } : email
    ));
    
    if (selectedEmail?.id === emailId) {
      setSelectedEmail(prev => prev ? { ...prev, isStarred } : null);
    }
    
    try {
      const response = await fetch(`/api/emails/${emailId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isStarred }),
      });
      
      if (!response.ok) throw new Error('Failed to star email');
      
      toast.success(isStarred ? "已加星标" : "已取消星标");
    } catch (error) {
      console.error('Error starring email:', error);
      // 回滚乐观更新
      setEmails(prev => prev.map(email => 
        email.id === emailId ? { ...email, isStarred: !isStarred } : email
      ));
      
      if (selectedEmail?.id === emailId) {
        setSelectedEmail(prev => prev ? { ...prev, isStarred: !isStarred } : null);
      }
      toast.error(isStarred ? "加星标失败" : "取消星标失败");
    }
  };

  // 归档邮件（乐观更新）
  const toggleEmailArchive = async (emailId: string, isArchived: boolean) => {
    // 乐观更新本地状态
    setEmails(prev => prev.map(email => 
      email.id === emailId ? { ...email, isArchived } : email
    ));
    
    if (selectedEmail?.id === emailId) {
      setSelectedEmail(null);
    }
    
    try {
      const response = await fetch(`/api/emails/${emailId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived }),
      });
      
      if (!response.ok) throw new Error('Failed to archive email');
      
      toast.success(isArchived ? "已归档" : "已取消归档");
    } catch (error) {
      console.error('Error archiving email:', error);
      // 回滚乐观更新
      setEmails(prev => prev.map(email => 
        email.id === emailId ? { ...email, isArchived: !isArchived } : email
      ));
      toast.error(isArchived ? "归档失败" : "取消归档失败");
    }
  };

  // 处理邮件选择
  const handleEmailSelect = (email: Email) => {
    setSelectedEmail(email);
    if (!email.isRead) {
      markEmailAsRead(email.id);
    }
  };

  // 处理导航点击
  const handleNavigationClick = (filter: 'inbox' | 'starred' | 'archived' | 'trash') => {
    setCurrentFilter(filter);
    setSelectedEmail(null);
    debouncedRefreshEmails();
  };

  // 处理搜索
  const handleSearch = (query: string, filters: SearchFilters) => {
    setSearchQuery(query);
    setSearchFilters(filters);
    setSelectedEmail(null);
    debouncedRefreshEmails();
  };

  // 处理通知函数注册
  const handleNewEmailNotification = (notifyFn: (email: Email) => void) => {
    setNewEmailNotifier(() => notifyFn);
  };

  // 处理批量操作
  const handleBatchOperation = async (operation: string) => {
    await batchOperations.executeBatchOperation(operation);
    // 刷新邮件列表以反映更改
    refreshEmails();
  };

  // 处理全选邮件
  const handleSelectAllEmails = () => {
    const emailIds = emails.map(email => email.id);
    batchOperations.selectAllEmails(emailIds);
  };

  // 处理邮箱选择
  const handleAddressSelect = (address: EmailAddress) => {
    setCurrentEmail(address.address);
    setCurrentAddressId(address.id);
    setCurrentEmailAddress(address);
    setEmails([]);
    setSelectedEmail(null);
    toast.success("已切换到邮箱: " + address.address);
    
    // 刷新邮件
    setTimeout(() => {
      refreshEmails();
    }, 500);
  };

  // 处理邮件更新（用于智能分类）
  const handleEmailUpdate = async (emailId: string, updates: Partial<Email>) => {
    // 乐观更新本地状态
    setEmails(prev => prev.map(email => 
      email.id === emailId ? { ...email, ...updates } : email
    ));
    
    if (selectedEmail?.id === emailId) {
      setSelectedEmail(prev => prev ? { ...prev, ...updates } : null);
    }
    
    try {
      const response = await fetch(`/api/emails/${emailId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) throw new Error('Failed to update email');
      
      if (updates.category || updates.tags || updates.verificationCode) {
        toast.success("邮件已更新");
      }
    } catch (error) {
      console.error('Error updating email:', error);
      // 回滚乐观更新
      setEmails(prev => prev.map(email => 
        email.id === emailId ? { ...email, ...Object.fromEntries(Object.keys(updates).map(key => [key, email[key as keyof Email]])) } : email
      ));
      toast.error("更新邮件失败");
    }
  };

  // 处理批量分类
  const handleBulkClassify = () => {
    refreshEmails();
  };

  // 处理邮箱地址更新
  const handleAddressUpdate = (address: EmailAddress) => {
    setCurrentEmailAddress(address);
    setCurrentEmail(address.address);
    setCurrentAddressId(address.id);
  };

  // 处理安全设置更改
  const handleSecuritySettingsChange = (settings: SecuritySettings) => {
    security.updateSettings(settings);
    // 重新处理当前显示的邮件
    refreshEmails();
  };

  // 清除搜索
  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchFilters({});
    setSelectedEmail(null);
    debouncedRefreshEmails();
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

  // 初始化时生成邮箱
  useEffect(() => {
    generateEmail();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 当过滤器或搜索条件变化时刷新邮件
  useEffect(() => {
    if (currentAddressId) {
      refreshEmails();
    }
  }, [currentAddressId]);

  // 当筛选条件变化时使用防抖刷新
  useEffect(() => {
    if (currentAddressId) {
      debouncedRefreshEmails();
    }
  }, [currentFilter, searchQuery, searchFilters, debouncedRefreshEmails]);

  // 自动检查新邮件
  useEffect(() => {
    if (!currentAddressId) return;

    const interval = setInterval(() => {
      // 只在收件箱视图且没有搜索条件时自动刷新
      if (currentFilter === 'inbox' && !searchQuery && Object.keys(searchFilters).length === 0) {
        refreshEmails();
      }
    }, 15000); // 增加间隔到15秒，减少频繁请求

    return () => clearInterval(interval);
  }, [currentAddressId, currentFilter, searchQuery, searchFilters, refreshEmails]);

  // 计算各类别邮件数量
  const unreadCount = emails.filter(email => !email.isRead && !email.isArchived && !email.isDeleted).length;
  const starredCount = emails.filter(email => email.isStarred && !email.isDeleted).length;
  const archivedCount = emails.filter(email => email.isArchived && !email.isDeleted).length;
  const trashCount = emails.filter(email => email.isDeleted).length;

  return (
    <EmailLayout
      currentEmail={currentEmail}
      currentEmailAddress={currentEmailAddress}
      onGenerateEmail={generateEmail}
      onSendTestEmail={sendTestEmail}
      onNavigationClick={handleNavigationClick}
      onSearch={handleSearch}
      onClearSearch={handleClearSearch}
      onNewEmailNotification={handleNewEmailNotification}
      onAddressSelect={handleAddressSelect}
      onAddressUpdate={handleAddressUpdate}
      onSecuritySettingsChange={handleSecuritySettingsChange}
      currentFilter={currentFilter}
      starredCount={starredCount}
      archivedCount={archivedCount}
      trashCount={trashCount}
      unreadCount={unreadCount}
      totalCount={emails.length}
      isLoading={isLoading}
    >
      <div className="flex flex-1 overflow-hidden">
        {/* 邮件列表 */}
        <div className="w-1/3 min-w-0 border-r">
          {/* 智能分类工具栏 */}
          <div className="p-3 border-b bg-muted/30">
            <SmartClassification 
              emails={emails}
              onEmailUpdate={handleEmailUpdate}
              onBulkClassify={handleBulkClassify}
            />
          </div>
          
          <EmailList
            emails={emails}
            selectedEmailId={selectedEmail?.id}
            onEmailSelect={handleEmailSelect}
            onEmailDelete={deleteEmail}
            onEmailMarkRead={markEmailAsRead}
            onEmailStar={toggleEmailStar}
            onEmailArchive={toggleEmailArchive}
            onRefresh={async () => { await refreshEmails(); }}
            isLoading={isLoading}
            // 批量操作相关
            selectedEmails={batchOperations.selectedEmails}
            isSelectionMode={batchOperations.isSelectionMode}
            onToggleEmailSelection={batchOperations.toggleEmailSelection}
            onSelectAllEmails={handleSelectAllEmails}
            onClearSelection={batchOperations.clearSelection}
            onEnterSelectionMode={batchOperations.enterSelectionMode}
            onExitSelectionMode={batchOperations.exitSelectionMode}
            onBatchOperation={handleBatchOperation}
            onUndoLastOperation={batchOperations.undoLastOperation}
            canUndo={batchOperations.canUndo}
          />
        </div>
        
        {/* 邮件详情 */}
        <div className="flex-1 min-w-0">
          <EmailDetail
            email={selectedEmail}
            onBack={() => setSelectedEmail(null)}
            onDelete={deleteEmail}
            onStar={toggleEmailStar}
            onArchive={toggleEmailArchive}
            onReply={() => {
              toast.info("回复功能正在开发中");
            }}
            onReplyAll={() => {
              toast.info("全部回复功能正在开发中");
            }}
            onForward={() => {
              toast.info("转发功能正在开发中");
            }}
          />
        </div>
      </div>
    </EmailLayout>
  );
}