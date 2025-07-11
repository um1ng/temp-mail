import { NextRequest, NextResponse } from 'next/server';
import { isImageUrlSafe } from '@/lib/security';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const encodedUrl = searchParams.get('url');
    
    if (!encodedUrl) {
      return NextResponse.json(
        { error: 'Missing image URL parameter' },
        { status: 400 }
      );
    }
    
    // 解码原始URL
    const originalUrl = Buffer.from(encodedUrl, 'base64').toString('utf-8');
    
    // 验证URL安全性
    if (!isImageUrlSafe(originalUrl)) {
      return NextResponse.json(
        { error: 'Unsafe image URL' },
        { status: 403 }
      );
    }
    
    // 获取图片
    const imageResponse = await fetch(originalUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TempMail-ImageProxy/1.0)',
        'Accept': 'image/*',
      },
    });
    
    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch image' },
        { status: imageResponse.status }
      );
    }
    
    // 验证内容类型
    const contentType = imageResponse.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Invalid content type' },
        { status: 415 }
      );
    }
    
    // 获取图片数据
    const imageData = await imageResponse.arrayBuffer();
    
    // 返回图片，设置安全头
    return new NextResponse(imageData, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600', // 缓存1小时
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'no-referrer',
      },
    });
  } catch (error) {
    console.error('Image proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}