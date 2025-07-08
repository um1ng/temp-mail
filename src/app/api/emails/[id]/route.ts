import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// 获取单个邮件详情
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: emailId } = await params;
    
    const email = await db.email.findUnique({
      where: { id: emailId },
      include: {
        attachments: true,
        emailAddress: true,
      },
    });
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email not found' },
        { status: 404 }
      );
    }
    
    // 检查邮箱地址是否仍然有效
    if (!email.emailAddress.isActive || email.emailAddress.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Email address has expired' },
        { status: 410 }
      );
    }
    
    return NextResponse.json(email);
  } catch (error) {
    console.error('Error fetching email:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 标记邮件为已读
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: emailId } = await params;
    const body = await request.json();
    
    const email = await db.email.findUnique({
      where: { id: emailId },
      include: { emailAddress: true },
    });
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email not found' },
        { status: 404 }
      );
    }
    
    // 检查邮箱地址是否仍然有效
    if (!email.emailAddress.isActive || email.emailAddress.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Email address has expired' },
        { status: 410 }
      );
    }
    
    // 更新邮件状态
    const updatedFields: { isRead?: boolean } = {};
    if (typeof body.isRead === 'boolean') {
      updatedFields.isRead = body.isRead;
    }
    
    const updatedEmail = await db.email.update({
      where: { id: emailId },
      data: updatedFields,
      include: {
        attachments: true,
      },
    });
    
    return NextResponse.json(updatedEmail);
  } catch (error) {
    console.error('Error updating email:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 删除邮件
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: emailId } = await params;
    
    const email = await db.email.findUnique({
      where: { id: emailId },
      include: { emailAddress: true },
    });
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email not found' },
        { status: 404 }
      );
    }
    
    // 检查邮箱地址是否仍然有效
    if (!email.emailAddress.isActive || email.emailAddress.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Email address has expired' },
        { status: 410 }
      );
    }
    
    // 删除邮件（附件会因为 CASCADE 自动删除）
    await db.email.delete({
      where: { id: emailId },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting email:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 