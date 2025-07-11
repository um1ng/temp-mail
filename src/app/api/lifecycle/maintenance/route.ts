import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST() {
  try {
    const now = new Date();
    const warningThreshold = new Date(now.getTime() + (30 * 60 * 1000)); // 30分钟后过期
    const autoRenewalThreshold = new Date(now.getTime() + (5 * 60 * 1000)); // 5分钟后过期
    
    // 查找需要警告的邮箱地址
    const warningAddresses = await db.emailAddress.findMany({
      where: {
        isActive: true,
        expiresAt: {
          lte: warningThreshold,
          gt: now,
        },
        warningsSent: {
          lt: 3, // 最多发送3次警告
        },
      },
    });

    // 查找需要自动续期的邮箱地址
    const autoRenewalAddresses = await db.emailAddress.findMany({
      where: {
        isActive: true,
        autoRenewalEnabled: true,
        expiresAt: {
          lte: autoRenewalThreshold,
          gt: now,
        },
      },
    });

    // 过滤掉已达到最大续期次数的地址
    const eligibleForRenewal = autoRenewalAddresses.filter(
      address => address.renewalCount < address.maxRenewals
    );

    // 查找已过期的邮箱地址
    const expiredAddresses = await db.emailAddress.findMany({
      where: {
        isActive: true,
        expiresAt: {
          lte: now,
        },
      },
    });

    const results = {
      warningsProcessed: 0,
      autoRenewalsProcessed: 0,
      expiredAddresses: 0,
    };

    // 处理过期警告
    for (const address of warningAddresses) {
      await db.emailAddress.update({
        where: { id: address.id },
        data: { warningsSent: address.warningsSent + 1 },
      });
      results.warningsProcessed++;
    }

    // 处理自动续期
    for (const address of eligibleForRenewal) {
      const newExpiresAt = new Date(
        Math.max(address.expiresAt.getTime(), now.getTime()) + 
        (address.customExpirationMinutes * 60 * 1000)
      );
      
      await db.emailAddress.update({
        where: { id: address.id },
        data: {
          expiresAt: newExpiresAt,
          renewalCount: address.renewalCount + 1,
          lastRenewalAt: now,
        },
      });
      results.autoRenewalsProcessed++;
    }

    // 处理已过期的邮箱地址
    for (const address of expiredAddresses) {
      await db.emailAddress.update({
        where: { id: address.id },
        data: { isActive: false },
      });
      results.expiredAddresses++;
    }

    return NextResponse.json({
      success: true,
      results,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error('Error in lifecycle maintenance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}