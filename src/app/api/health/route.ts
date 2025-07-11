import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // 测试数据库连接
    const emailAddressCount = await db.emailAddress.count();
    const emailCount = await db.email.count();
    
    // 获取一个活跃的邮箱地址作为测试
    const activeAddress = await db.emailAddress.findFirst({
      where: {
        isActive: true,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    return NextResponse.json({
      status: 'ok',
      database: {
        connected: true,
        emailAddresses: emailAddressCount,
        emails: emailCount,
      },
      testAddress: activeAddress ? {
        id: activeAddress.id,
        address: activeAddress.address,
        expiresAt: activeAddress.expiresAt,
      } : null
    });

  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error',
        database: {
          connected: false
        }
      },
      { status: 500 }
    );
  }
}