import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const batchOperationSchema = z.object({
  emailIds: z.array(z.string()).min(1),
  operation: z.enum(['markRead', 'markUnread', 'star', 'unstar', 'archive', 'unarchive', 'delete', 'restore']),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { emailIds, operation } = batchOperationSchema.parse(body);
    
    // 验证邮件是否存在
    const emails = await db.email.findMany({
      where: { id: { in: emailIds } },
      select: { id: true, isRead: true, isStarred: true, isArchived: true, isDeleted: true }
    });
    
    if (emails.length !== emailIds.length) {
      return NextResponse.json(
        { error: 'Some emails not found' },
        { status: 404 }
      );
    }
    
    // 执行批量操作
    let updateData: Record<string, boolean> = {};
    
    switch (operation) {
      case 'markRead':
        updateData = { isRead: true };
        break;
      case 'markUnread':
        updateData = { isRead: false };
        break;
      case 'star':
        updateData = { isStarred: true };
        break;
      case 'unstar':
        updateData = { isStarred: false };
        break;
      case 'archive':
        updateData = { isArchived: true };
        break;
      case 'unarchive':
        updateData = { isArchived: false };
        break;
      case 'delete':
        updateData = { isDeleted: true };
        break;
      case 'restore':
        updateData = { isDeleted: false };
        break;
    }
    
    const result = await db.email.updateMany({
      where: { id: { in: emailIds } },
      data: updateData,
    });
    
    return NextResponse.json({
      success: true,
      operation,
      affectedCount: result.count,
      emailIds,
      previousStates: emails, // 用于撤销操作
    });
  } catch (error) {
    console.error('Error in batch operation:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 撤销批量操作
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { previousStates } = body;
    
    // 恢复每个邮件的原始状态
    const updatePromises = previousStates.map((state: { id: string; isRead: boolean; isStarred: boolean; isArchived: boolean; isDeleted: boolean }) => 
      db.email.update({
        where: { id: state.id },
        data: {
          isRead: state.isRead,
          isStarred: state.isStarred,
          isArchived: state.isArchived,
          isDeleted: state.isDeleted,
        },
      })
    );
    
    await Promise.all(updatePromises);
    
    return NextResponse.json({
      success: true,
      message: 'Batch operation undone successfully',
      restoredCount: previousStates.length,
    });
  } catch (error) {
    console.error('Error undoing batch operation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}