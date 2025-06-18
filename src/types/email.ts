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
  hasAttachments: boolean;
  attachments?: Attachment[];
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
}

export interface GetEmailsResponse {
  emails: Email[];
  total: number;
  hasMore: boolean;
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
  totalAttachments: number;
} 