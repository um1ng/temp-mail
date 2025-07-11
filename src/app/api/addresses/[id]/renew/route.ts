import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const renewEmailAddressSchema = z.object({
  additionalMinutes: z.number().min(1).max(1440).optional().default(60),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { additionalMinutes } = renewEmailAddressSchema.parse(body);
    
    // 获取当前邮箱地址
    const emailAddress = await db.emailAddress.findUnique({
      where: { id },
    });
    
    if (!emailAddress) {
      return NextResponse.json(
        { error: 'Email address not found' },
        { status: 404 }
      );
    }
    
    // 检查是否达到最大续期次数
    if (emailAddress.renewalCount >= emailAddress.maxRenewals) {
      return NextResponse.json(
        { error: 'Maximum renewal limit reached' },
        { status: 400 }
      );
    }
    
    // 计算新的过期时间
    const currentTime = new Date();
    const newExpiresAt = new Date(Math.max(
      emailAddress.expiresAt.getTime(),
      currentTime.getTime()
    ) + (additionalMinutes * 60 * 1000));
    
    // 更新邮箱地址
    const updatedAddress = await db.emailAddress.update({
      where: { id },
      data: {
        expiresAt: newExpiresAt,
        renewalCount: emailAddress.renewalCount + 1,
        lastRenewalAt: currentTime,
        isActive: true,
      },
    });
    
    return NextResponse.json({
      emailAddress: updatedAddress,
      message: 'Email address renewed successfully',
    });
  } catch (error) {
    console.error('Error renewing email address:', error);
    
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