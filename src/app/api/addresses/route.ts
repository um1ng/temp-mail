import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { CreateEmailAddressRequest, CreateEmailAddressResponse } from '@/types/email';
import { z } from 'zod';

const createEmailAddressSchema = z.object({
  domain: z.string().optional(),
  expirationMinutes: z.number().min(1).max(1440).optional().default(60),
  autoRenewalEnabled: z.boolean().optional().default(false),
  maxRenewals: z.number().min(1).max(10).optional().default(3),
  label: z.string().optional(),
});

// 生成随机邮箱地址
function generateRandomAddress(domain?: string): string {
  const randomString = Math.random().toString(36).substring(2, 12);
  const availableDomains = process.env.ALLOWED_DOMAINS?.split(',') || [
    'tempmail.local',
    '10minutemail.local',
    'guerrillamail.local'
  ];
  
  const selectedDomain = domain || availableDomains[Math.floor(Math.random() * availableDomains.length)];
  return `${randomString}@${selectedDomain}`;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateEmailAddressRequest = await request.json();
    const { domain, expirationMinutes, autoRenewalEnabled, maxRenewals, label } = createEmailAddressSchema.parse(body);
    
    // 生成唯一的邮箱地址
    let address: string;
    let attempts = 0;
    const maxAttempts = 10;
    
    do {
      address = generateRandomAddress(domain);
      attempts++;
      
      if (attempts > maxAttempts) {
        return NextResponse.json(
          { error: 'Failed to generate unique email address' },
          { status: 500 }
        );
      }
      
      const existing = await db.emailAddress.findUnique({
        where: { address }
      });
      
      if (!existing) break;
    } while (true);
    
    // 计算过期时间
    const expiresAt = new Date(Date.now() + (expirationMinutes * 60 * 1000));
    
    // 创建新邮箱地址
    const emailAddress = await db.emailAddress.create({
      data: {
        address,
        expiresAt,
        autoRenewalEnabled,
        maxRenewals,
        customExpirationMinutes: expirationMinutes,
        label,
      },
    });
    
    const response: CreateEmailAddressResponse = {
      emailAddress,
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error creating email address:', error);
    
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    
    // 如果提供了address参数，返回特定地址的信息
    if (address) {
      const emailAddress = await db.emailAddress.findUnique({
        where: { address },
        include: {
          emails: {
            orderBy: { receivedAt: 'desc' },
            take: 50,
            include: {
              attachments: true,
            },
          },
        },
      });
      
      if (!emailAddress) {
        return NextResponse.json(
          { error: 'Email address not found' },
          { status: 404 }
        );
      }
      
      // 检查是否过期
      if (emailAddress.expiresAt < new Date() || !emailAddress.isActive) {
        return NextResponse.json(
          { error: 'Email address has expired' },
          { status: 410 }
        );
      }
      
      return NextResponse.json(emailAddress);
    }
    
    // 如果没有提供address参数，返回所有邮箱地址列表
    const addresses = await db.emailAddress.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        _count: {
          select: {
            emails: true,
          },
        },
      },
    });
    
    return NextResponse.json({ addresses });
  } catch (error) {
    console.error('Error fetching email address:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 