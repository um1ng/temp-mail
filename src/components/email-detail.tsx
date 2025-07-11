"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { EmailForwardShare } from "@/components/email-forward-share"
import { 
  Reply, 
  ReplyAll, 
  Forward,
  Star,
  Archive,
  Trash2,
  MoreVertical,
  ArrowLeft,
  Paperclip,
  Download
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Email {
  id: string
  from: string
  to: string
  subject: string
  content: string
  timestamp: Date
  isRead: boolean
  isStarred?: boolean
  isArchived?: boolean
  isDeleted?: boolean
  hasAttachments?: boolean
  attachments?: Array<{
    name: string
    size: string
    type: string
  }>
}

interface EmailDetailProps {
  email: Email | null
  onBack?: () => void
  onReply?: (email: Email) => void
  onReplyAll?: (email: Email) => void
  onForward?: (email: Email) => void
  onDelete?: (emailId: string) => void
  onStar?: (emailId: string, isStarred: boolean) => void
  onArchive?: (emailId: string, isArchived: boolean) => void
  className?: string
}

export function EmailDetail({ 
  email, 
  onBack,
  onReply,
  onReplyAll,
  onForward,
  onDelete,
  onStar,
  onArchive,
  className 
}: EmailDetailProps) {

  const getInitials = (email: string) => {
    const parts = email.split('@')[0]
    return parts.slice(0, 2).toUpperCase()
  }

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleStar = () => {
    onStar?.(email!.id, !email!.isStarred)
  }

  const handleArchive = () => {
    onArchive?.(email!.id, !email!.isArchived)
  }

  if (!email) {
    return (
      <div className={cn("flex-1 flex items-center justify-center p-8", className)}>
        <div className="text-center space-y-2">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto">
            <Reply className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">选择邮件</h3>
          <p className="text-sm text-muted-foreground">
            点击左侧邮件列表中的任一邮件来查看详情
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex-1 flex flex-col", className)}>
      {/* 工具栏 */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="lg:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReply?.(email)}
            >
              <Reply className="h-4 w-4 mr-2" />
              回复
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReplyAll?.(email)}
            >
              <ReplyAll className="h-4 w-4 mr-2" />
              全部回复
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onForward?.(email)}
            >
              <Forward className="h-4 w-4 mr-2" />
              转发
            </Button>
            <EmailForwardShare email={email} />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleStar}
            className={email.isStarred ? "text-yellow-500" : ""}
          >
            <Star className={cn("h-4 w-4", email.isStarred && "fill-current")} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleArchive}
          >
            <Archive className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onDelete?.(email.id)}>
                <Trash2 className="mr-2 h-4 w-4" />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 邮件内容 */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* 邮件头部 */}
          <div className="space-y-4">
            <h1 className="text-2xl font-bold">
              {email.subject || "(无主题)"}
            </h1>
            
            <div className="flex items-start gap-4">
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarFallback className="text-sm">
                  {getInitials(email.from)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{email.from}</span>
                      {!email.isRead && (
                        <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                          新
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      收件人：{email.to}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(email.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* 附件 */}
          {email.hasAttachments && email.attachments && (
            <div className="space-y-2">
              <p className="text-sm font-medium flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                附件 ({email.attachments.length})
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {email.attachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="p-2 bg-muted rounded">
                      <Paperclip className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {attachment.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {attachment.size}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" className="p-1 h-8 w-8">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 邮件正文 */}
          <div className="space-y-4">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <div 
                className="whitespace-pre-wrap text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: email.content }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 