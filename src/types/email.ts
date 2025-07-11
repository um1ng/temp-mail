export interface EmailAddress {
  id: string;
  address: string;
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
}

export interface Email {
  id: string;
  emailAddressId: string;
  fromAddress: string;
  toAddress: string;
  subject?: string;
  textContent?: string;
  htmlContent?: string;
  receivedAt: Date;
  isRead: boolean;
  isStarred: boolean;
  isArchived: boolean;
  isDeleted: boolean;
  hasAttachments: boolean;
  attachments?: Attachment[];
  // 智能分类字段
  category?: string;
  tags?: string[];
  verificationCode?: string;
  // 加密状态
  isEncrypted?: boolean;
  // 兼容性字段 - 用于页面组件
  from?: string;
  to?: string;
  content?: string;
  timestamp?: Date;
}

export interface Attachment {
  id: string;
  emailId: string;
  filename: string;
  contentType?: string;
  size?: number;
  filePath?: string;
}

export interface CreateEmailAddressRequest {
  domain?: string;
  expirationMinutes?: number;
}

export interface CreateEmailAddressResponse {
  emailAddress: EmailAddress;
}

export interface GetEmailsRequest {
  emailAddressId: string;
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  filter?: 'inbox' | 'starred' | 'archived' | 'trash';
}

export interface GetEmailsResponse {
  emails: Email[];
  total: number;
  hasMore: boolean;
}

export interface UpdateEmailRequest {
  emailId: string;
  isRead?: boolean;
  isStarred?: boolean;
  isArchived?: boolean;
  isDeleted?: boolean;
}

export interface MarkEmailReadRequest {
  emailId: string;
}

export interface DeleteEmailRequest {
  emailId: string;
}

export interface EmailStats {
  totalEmails: number;
  unreadEmails: number;
  starredEmails: number;
  archivedEmails: number;
  deletedEmails: number;
  totalAttachments: number;
} 