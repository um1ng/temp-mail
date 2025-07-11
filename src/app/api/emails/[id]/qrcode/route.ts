import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import QRCode from 'qrcode';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: emailId } = await context.params;
    const { searchParams } = new URL(request.url);
    const shareToken = searchParams.get('token');
    
    if (!shareToken) {
      return NextResponse.json(
        { error: '缺少分享令牌' },
        { status: 400 }
      );
    }

    // 验证分享令牌
    const shareLink = await db.emailShare.findFirst({
      where: {
        emailId,
        shareToken,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!shareLink) {
      return NextResponse.json(
        { error: '分享链接不存在或已过期' },
        { status: 404 }
      );
    }

    // 生成分享URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3333';
    const shareUrl = `${baseUrl}/share/${shareToken}`;

    // 生成二维码
    const qrCodeOptions = {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    };

    const qrCodeBuffer = await QRCode.toBuffer(shareUrl, qrCodeOptions);

    return new NextResponse(qrCodeBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    return NextResponse.json(
      { error: '生成二维码失败' },
      { status: 500 }
    );
  }
}