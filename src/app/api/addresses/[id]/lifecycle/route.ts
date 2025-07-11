import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const updateLifecycleSchema = z.object({
  autoRenewalEnabled: z.boolean().optional(),
  customExpirationMinutes: z.number().min(1).max(1440).optional(),
  maxRenewals: z.number().min(1).max(10).optional(),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const updates = updateLifecycleSchema.parse(body);
    
    // 检查邮箱地址是否存在
    const emailAddress = await db.emailAddress.findUnique({
      where: { id },
    });
    
    if (!emailAddress) {
      return NextResponse.json(
        { error: 'Email address not found' },
        { status: 404 }
      );
    }
    
    // 更新邮箱地址生命周期设置
    const updatedAddress = await db.emailAddress.update({
      where: { id },
      data: updates,
    });
    
    return NextResponse.json({
      emailAddress: updatedAddress,
      message: 'Lifecycle settings updated successfully',
    });
  } catch (error) {
    console.error('Error updating lifecycle settings:', error);
    
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