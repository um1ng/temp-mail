"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  X, 
  Mail, 
  MailOpen, 
  Star, 
  Archive, 
  Trash2, 
  RotateCcw,
  CheckSquare,
  Square,
  Minus
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface BatchOperationToolbarProps {
  selectedCount: number
  totalCount: number
  isSelectionMode: boolean
  canUndo: boolean
  onSelectAll: () => void
  onClearSelection: () => void
  onEnterSelectionMode: () => void
  onExitSelectionMode: () => void
  onBatchOperation: (operation: string) => void
  onUndoLastOperation: () => void
}

export function BatchOperationToolbar({
  selectedCount,
  totalCount,
  isSelectionMode,
  canUndo,
  onSelectAll,
  onClearSelection,
  onEnterSelectionMode,
  onExitSelectionMode,
  onBatchOperation,
  onUndoLastOperation,
}: BatchOperationToolbarProps) {
  const isAllSelected = selectedCount === totalCount && totalCount > 0
  const hasSelection = selectedCount > 0

  if (!isSelectionMode) {
    return (
      <div className="flex items-center gap-2 p-2 border-b bg-background">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onEnterSelectionMode}
                disabled={totalCount === 0}
              >
                <CheckSquare className="h-4 w-4" />
                <span className="ml-1">批量操作</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>进入批量选择模式</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {canUndo && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onUndoLastOperation}
                >
                  <RotateCcw className="h-4 w-4" />
                  <span className="ml-1">撤销</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>撤销上一次批量操作</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 p-2 border-b bg-muted/50">
      {/* 选择状态 */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onExitSelectionMode}
        >
          <X className="h-4 w-4" />
        </Button>
        
        <Badge variant="secondary" className="text-xs">
          {selectedCount} / {totalCount}
        </Badge>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={isAllSelected ? onClearSelection : onSelectAll}
          disabled={totalCount === 0}
        >
          {isAllSelected ? (
            <Minus className="h-4 w-4" />
          ) : (
            <Square className="h-4 w-4" />
          )}
          <span className="ml-1">
            {isAllSelected ? "取消全选" : "全选"}
          </span>
        </Button>
      </div>

      {/* 批量操作按钮 */}
      {hasSelection && (
        <div className="flex items-center gap-1 ml-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onBatchOperation('markRead')}
                >
                  <MailOpen className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>标记为已读</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onBatchOperation('markUnread')}
                >
                  <Mail className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>标记为未读</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onBatchOperation('star')}
                >
                  <Star className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>加星标</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onBatchOperation('archive')}
                >
                  <Archive className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>归档</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onBatchOperation('delete')}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>删除</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </div>
  )
}