"use client"

import * as React from "react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { 
  Mail, 
  MoreVertical,
  Star,
  Archive,
  Trash2,
  MailOpen,
  Paperclip
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
  hasAttachments?: boolean
}

interface EmailListProps {
  emails: Email[]
  selectedEmailId?: string
  onEmailSelect?: (email: Email) => void
  onEmailDelete?: (emailId: string) => void
  onEmailMarkRead?: (emailId: string) => void
  isLoading?: boolean
}

export function EmailList({ 
  emails, 
  selectedEmailId,
  onEmailSelect,
  onEmailDelete,
  onEmailMarkRead,
  isLoading 
}: EmailListProps) {
  const [hoveredEmailId, setHoveredEmailId] = useState<string | null>(null)

  const getInitials = (email: string) => {
    const parts = email.split('@')[0]
    return parts.slice(0, 2).toUpperCase()
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor(diff / (1000 * 60))

    if (minutes < 1) return "刚刚"
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    return date.toLocaleDateString()
  }

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content
    return content.slice(0, maxLength) + "..."
  }

  if (isLoading) {
    return (
      <div className="flex-1 p-4">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="rounded-full bg-muted h-10 w-10"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                  <div className="h-3 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (emails.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-2">
          <Mail className="h-12 w-12 text-muted-foreground mx-auto" />
          <h3 className="text-lg font-medium">暂无邮件</h3>
          <p className="text-sm text-muted-foreground">
            当有新邮件到达时，它们会显示在这里
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="divide-y">
        {emails.map((email) => (
          <div
            key={email.id}
            className={cn(
              "flex items-center gap-3 p-4 cursor-pointer transition-colors hover:bg-muted/50",
              selectedEmailId === email.id && "bg-muted",
              !email.isRead && "bg-blue-50/50 dark:bg-blue-950/20"
            )}
            onClick={() => onEmailSelect?.(email)}
            onMouseEnter={() => setHoveredEmailId(email.id)}
            onMouseLeave={() => setHoveredEmailId(null)}
          >
            {/* 发件人头像 */}
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarFallback className="text-xs">
                {getInitials(email.from)}
              </AvatarFallback>
            </Avatar>

            {/* 邮件内容 */}
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={cn(
                    "text-sm truncate",
                    !email.isRead ? "font-semibold" : "font-medium"
                  )}>
                    {email.from}
                  </span>
                  {!email.isRead && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                      新
                    </Badge>
                  )}
                  {email.hasAttachments && (
                    <Paperclip className="h-3 w-3 text-muted-foreground" />
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">
                    {formatTime(email.timestamp)}
                  </span>
                  {(hoveredEmailId === email.id || selectedEmailId === email.id) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-6 p-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {!email.isRead && (
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation()
                              onEmailMarkRead?.(email.id)
                            }}
                          >
                            <MailOpen className="mr-2 h-4 w-4" />
                            标记为已读
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem>
                          <Star className="mr-2 h-4 w-4" />
                          加星标
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Archive className="mr-2 h-4 w-4" />
                          归档
                        </DropdownMenuItem>
                        <Separator className="my-1" />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            onEmailDelete?.(email.id)
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          删除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
              
              <div className="space-y-1">
                <p className={cn(
                  "text-sm truncate",
                  !email.isRead ? "font-medium" : "text-muted-foreground"
                )}>
                  {email.subject || "(无主题)"}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {truncateContent(email.content)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 