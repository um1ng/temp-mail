"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";

interface BatchOperation {
  id: string;
  operation: string;
  emailIds: string[];
  previousStates: EmailState[];
  timestamp: Date;
}

interface EmailState {
  id: string;
  isRead: boolean;
  isStarred: boolean;
  isArchived: boolean;
  isDeleted: boolean;
}

interface MailboxBatchOperation {
  id: string;
  type: 'renew' | 'delete' | 'archive' | 'export' | 'label';
  label: string;
  description: string;
  icon: string;
  confirmRequired?: boolean;
  params?: Record<string, unknown>;
}

export const MAILBOX_BATCH_OPERATIONS: MailboxBatchOperation[] = [
  {
    id: 'renew',
    type: 'renew',
    label: '批量续期',
    description: '为选中的邮箱续期1小时',
    icon: '🔄',
    confirmRequired: false,
    params: { additionalMinutes: 60 }
  },
  {
    id: 'renew-custom',
    type: 'renew',
    label: '自定义续期',
    description: '为选中的邮箱自定义续期时间',
    icon: '⏰',
    confirmRequired: false,
    params: { customMinutes: true }
  },
  {
    id: 'delete',
    type: 'delete',
    label: '批量删除',
    description: '删除选中的邮箱（不可恢复）',
    icon: '🗑️',
    confirmRequired: true
  },
  {
    id: 'archive',
    type: 'archive',
    label: '批量归档',
    description: '将选中的邮箱设为非活跃状态',
    icon: '📦',
    confirmRequired: true
  },
  {
    id: 'export',
    type: 'export',
    label: '导出数据',
    description: '导出选中邮箱的详细信息',
    icon: '📄',
    confirmRequired: false
  },
  {
    id: 'label',
    type: 'label',
    label: '批量标签',
    description: '为选中的邮箱添加或修改标签',
    icon: '🏷️',
    confirmRequired: false
  }
];

interface UseBatchOperationsReturn {
  selectedEmails: Set<string>;
  batchOperations: BatchOperation[];
  isSelectionMode: boolean;
  toggleEmailSelection: (emailId: string) => void;
  selectAllEmails: (emailIds: string[]) => void;
  clearSelection: () => void;
  enterSelectionMode: () => void;
  exitSelectionMode: () => void;
  executeBatchOperation: (operation: string) => Promise<void>;
  undoLastOperation: () => Promise<void>;
  canUndo: boolean;
  // 邮箱管理专用
  selectedMailboxes: Set<string>;
  toggleMailboxSelection: (mailboxId: string) => void;
  selectAllMailboxes: (mailboxIds: string[]) => void;
  clearMailboxSelection: () => void;
  executeMailboxBatchOperation: (operation: MailboxBatchOperation, params?: Record<string, unknown>) => Promise<boolean>;
  isProcessing: boolean;
  selectedMailboxCount: number;
}

export function useBatchOperations(): UseBatchOperationsReturn {
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [selectedMailboxes, setSelectedMailboxes] = useState<Set<string>>(new Set());
  const [batchOperations, setBatchOperations] = useState<BatchOperation[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const toggleEmailSelection = useCallback((emailId: string) => {
    setSelectedEmails(prev => {
      const newSet = new Set(prev);
      if (newSet.has(emailId)) {
        newSet.delete(emailId);
      } else {
        newSet.add(emailId);
      }
      return newSet;
    });
  }, []);

  const toggleMailboxSelection = useCallback((mailboxId: string) => {
    setSelectedMailboxes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(mailboxId)) {
        newSet.delete(mailboxId);
      } else {
        newSet.add(mailboxId);
      }
      return newSet;
    });
  }, []);

  const selectAllEmails = useCallback((emailIds: string[]) => {
    setSelectedEmails(new Set(emailIds));
  }, []);

  const selectAllMailboxes = useCallback((mailboxIds: string[]) => {
    setSelectedMailboxes(new Set(mailboxIds));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedEmails(new Set());
  }, []);

  const clearMailboxSelection = useCallback(() => {
    setSelectedMailboxes(new Set());
  }, []);

  const enterSelectionMode = useCallback(() => {
    setIsSelectionMode(true);
  }, []);

  const exitSelectionMode = useCallback(() => {
    setIsSelectionMode(false);
    clearSelection();
  }, [clearSelection]);

  const executeBatchOperation = useCallback(async (operation: string) => {
    if (selectedEmails.size === 0) {
      toast.error("请选择要操作的邮件");
      return;
    }

    try {
      const response = await fetch('/api/emails/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailIds: Array.from(selectedEmails),
          operation,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Batch operation failed');
      }

      const result = await response.json();
      
      // 记录操作以便撤销
      const batchOperation: BatchOperation = {
        id: Date.now().toString(),
        operation,
        emailIds: result.emailIds,
        previousStates: result.previousStates,
        timestamp: new Date(),
      };
      
      setBatchOperations(prev => [batchOperation, ...prev.slice(0, 4)]); // 最多保留5个操作
      
      // 操作成功提示
      const operationNames: { [key: string]: string } = {
        markRead: '标记为已读',
        markUnread: '标记为未读',
        star: '加星标',
        unstar: '取消星标',
        archive: '归档',
        unarchive: '取消归档',
        delete: '删除',
        restore: '恢复',
      };
      
      toast.success(`已${operationNames[operation]}${result.affectedCount}封邮件`, {
        action: {
          label: "撤销",
          onClick: () => undoLastOperation(),
        },
      });
      
      clearSelection();
    } catch (error) {
      console.error('Error executing batch operation:', error);
      toast.error(error instanceof Error ? error.message : '批量操作失败');
    }
  }, [selectedEmails, clearSelection]);

  const executeMailboxBatchOperation = useCallback(async (
    operation: MailboxBatchOperation,
    params?: Record<string, unknown>
  ) => {
    if (selectedMailboxes.size === 0) {
      toast.error('请先选择要操作的邮箱');
      return false;
    }

    setIsProcessing(true);
    const selectedArray = Array.from(selectedMailboxes);

    try {
      switch (operation.type) {
        case 'renew':
          await batchRenew(selectedArray, params);
          break;
        case 'delete':
          await batchDelete(selectedArray);
          break;
        case 'archive':
          await batchArchive(selectedArray);
          break;
        case 'export':
          await batchExport(selectedArray);
          break;
        case 'label':
          await batchLabel(selectedArray, params);
          break;
        default:
          throw new Error(`Unknown operation: ${operation.type}`);
      }

      toast.success(`${operation.label}完成，处理了 ${selectedMailboxes.size} 个邮箱`);
      clearMailboxSelection();
      return true;
    } catch (error) {
      console.error(`Batch operation ${operation.type} failed:`, error);
      toast.error(`${operation.label}失败: ${error instanceof Error ? error.message : '未知错误'}`);
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [selectedMailboxes, clearMailboxSelection]);

  const undoLastOperation = useCallback(async () => {
    const lastOperation = batchOperations[0];
    if (!lastOperation) {
      toast.error("没有可撤销的操作");
      return;
    }

    try {
      const response = await fetch('/api/emails/batch', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          previousStates: lastOperation.previousStates,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Undo operation failed');
      }

      setBatchOperations(prev => prev.slice(1));
      toast.success("操作已撤销");
    } catch (error) {
      console.error('Error undoing batch operation:', error);
      toast.error(error instanceof Error ? error.message : '撤销失败');
    }
  }, [batchOperations]);

  return {
    selectedEmails,
    batchOperations,
    isSelectionMode,
    toggleEmailSelection,
    selectAllEmails,
    clearSelection,
    enterSelectionMode,
    exitSelectionMode,
    executeBatchOperation,
    undoLastOperation,
    canUndo: batchOperations.length > 0,
    // 邮箱管理专用
    selectedMailboxes,
    toggleMailboxSelection,
    selectAllMailboxes,
    clearMailboxSelection,
    executeMailboxBatchOperation,
    isProcessing,
    selectedMailboxCount: selectedMailboxes.size,
  };
}

// 批量续期
async function batchRenew(ids: string[], params?: Record<string, unknown>) {
  const additionalMinutes = params?.customMinutes ? params.minutes : 60;
  
  const promises = ids.map(id =>
    fetch(`/api/addresses/${id}/renew`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ additionalMinutes }),
    })
  );

  const responses = await Promise.allSettled(promises);
  const failed = responses.filter(r => r.status === 'rejected').length;
  
  if (failed > 0) {
    throw new Error(`${failed} 个邮箱续期失败`);
  }
}

// 批量删除
async function batchDelete(ids: string[]) {
  const promises = ids.map(id =>
    fetch(`/api/addresses/${id}`, {
      method: 'DELETE',
    })
  );

  const responses = await Promise.allSettled(promises);
  const failed = responses.filter(r => r.status === 'rejected').length;
  
  if (failed > 0) {
    throw new Error(`${failed} 个邮箱删除失败`);
  }
}

// 批量归档
async function batchArchive(ids: string[]) {
  const promises = ids.map(id =>
    fetch(`/api/addresses/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: false }),
    })
  );

  const responses = await Promise.allSettled(promises);
  const failed = responses.filter(r => r.status === 'rejected').length;
  
  if (failed > 0) {
    throw new Error(`${failed} 个邮箱归档失败`);
  }
}

// 批量导出
async function batchExport(ids: string[]) {
  const response = await fetch('/api/addresses/batch/export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ addressIds: ids }),
  });

  if (!response.ok) {
    throw new Error('导出失败');
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mailboxes_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 批量标签
async function batchLabel(ids: string[], params?: Record<string, unknown>) {
  const label = params?.label || '';
  
  const promises = ids.map(id =>
    fetch(`/api/addresses/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label }),
    })
  );

  const responses = await Promise.allSettled(promises);
  const failed = responses.filter(r => r.status === 'rejected').length;
  
  if (failed > 0) {
    throw new Error(`${failed} 个邮箱标签更新失败`);
  }
}