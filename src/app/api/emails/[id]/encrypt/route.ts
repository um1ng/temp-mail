import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { 
  encrypt, 
  decrypt, 
  EncryptionAlgorithm, 
  EncryptionResult,
  generateKeyPair,
  validateKeyStrength 
} from '@/lib/encryption';

// 加密邮件内容
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      emailId, 
      algorithm = EncryptionAlgorithm.AES_256_GCM, 
      password,
      generateNewKey = false 
    } = body;

    if (!emailId || !password) {
      return NextResponse.json(
        { error: '邮件ID和密码不能为空' },
        { status: 400 }
      );
    }

    // 验证密码强度
    const keyStrength = validateKeyStrength(password);
    if (!keyStrength.isStrong) {
      return NextResponse.json(
        { 
          error: '密码强度不足',
          recommendations: keyStrength.recommendations,
          score: keyStrength.score
        },
        { status: 400 }
      );
    }

    // 获取邮件
    const email = await db.email.findUnique({
      where: { id: emailId },
      include: {
        attachments: true,
      },
    });

    if (!email) {
      return NextResponse.json(
        { error: '邮件不存在' },
        { status: 404 }
      );
    }

    // 检查是否已加密
    if (email.isEncrypted) {
      return NextResponse.json(
        { error: '邮件已经加密' },
        { status: 400 }
      );
    }

    let keyPair;
    if (generateNewKey) {
      keyPair = generateKeyPair();
    }

    // 加密内容
    const encryptedContent: EncryptionResult = encrypt(
      email.textContent || email.htmlContent || '',
      algorithm,
      password,
      keyPair ? { publicKey: keyPair.publicKey, privateKey: keyPair.privateKey } : undefined
    );

    // 加密主题
    const encryptedSubject: EncryptionResult = encrypt(
      email.subject || '',
      algorithm,
      password,
      keyPair ? { publicKey: keyPair.publicKey, privateKey: keyPair.privateKey } : undefined
    );

    // 更新数据库
    await db.email.update({
      where: { id: emailId },
      data: {
        isEncrypted: true,
        encryptionAlgorithm: algorithm,
        encryptedContent: JSON.stringify(encryptedContent),
        encryptedSubject: JSON.stringify(encryptedSubject),
        // 清空明文内容以提高安全性
        textContent: null,
        htmlContent: null,
        subject: '🔒 已加密邮件',
      },
    });

    // 记录加密操作
    await db.emailEncryption.create({
      data: {
        emailId: emailId,
        algorithm: algorithm,
        encryptedAt: new Date(),
        keyId: keyPair?.publicKey.substring(0, 8) || null,
      },
    });

    return NextResponse.json({
      success: true,
      algorithm,
      keyId: keyPair?.publicKey.substring(0, 8),
      publicKey: keyPair?.publicKey,
      message: '邮件加密成功'
    });

  } catch (error) {
    console.error('Email encryption error:', error);
    return NextResponse.json(
      { error: '加密失败' },
      { status: 500 }
    );
  }
}

// 解密邮件内容
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { emailId, password, privateKey } = body;

    if (!emailId || (!password && !privateKey)) {
      return NextResponse.json(
        { error: '邮件ID和解密密钥不能为空' },
        { status: 400 }
      );
    }

    // 获取加密邮件
    const email = await db.email.findUnique({
      where: { id: emailId },
    });

    if (!email) {
      return NextResponse.json(
        { error: '邮件不存在' },
        { status: 404 }
      );
    }

    if (!email.isEncrypted || !email.encryptedContent) {
      return NextResponse.json(
        { error: '邮件未加密' },
        { status: 400 }
      );
    }

    // 解析加密数据
    const encryptedContent: EncryptionResult = JSON.parse(email.encryptedContent);
    const encryptedSubject: EncryptionResult = JSON.parse(email.encryptedSubject || '{}');

    // 解密内容
    let decryptedContent: string;
    let decryptedSubject: string;

    try {
      decryptedContent = decrypt(encryptedContent, {
        password,
        privateKey,
      });

      decryptedSubject = decrypt(encryptedSubject, {
        password,
        privateKey,
      });
    } catch {
      return NextResponse.json(
        { error: '解密失败，请检查密码或密钥' },
        { status: 401 }
      );
    }

    // 记录解密操作
    await db.emailDecryption.create({
      data: {
        emailId: emailId,
        decryptedAt: new Date(),
        success: true,
      },
    });

    return NextResponse.json({
      success: true,
      content: decryptedContent,
      subject: decryptedSubject,
      algorithm: encryptedContent.algorithm,
      message: '邮件解密成功'
    });

  } catch (error) {
    console.error('Email decryption error:', error);
    
    // 记录失败的解密尝试
    try {
      const { emailId } = await request.json();
      await db.emailDecryption.create({
        data: {
          emailId: emailId,
          decryptedAt: new Date(),
          success: false,
        },
      });
    } catch {}

    return NextResponse.json(
      { error: '解密失败' },
      { status: 500 }
    );
  }
}

// 获取加密状态和统计
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const emailId = searchParams.get('emailId');

    if (emailId) {
      // 获取特定邮件的加密状态
      const email = await db.email.findUnique({
        where: { id: emailId },
        include: {
          encryptions: true,
          decryptions: {
            orderBy: { decryptedAt: 'desc' },
            take: 5,
          },
        },
      });

      if (!email) {
        return NextResponse.json(
          { error: '邮件不存在' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        emailId,
        isEncrypted: email.isEncrypted,
        algorithm: email.encryptionAlgorithm,
        encryptedAt: email.encryptions[0]?.encryptedAt,
        decryptionAttempts: email.decryptions.length,
        lastDecryption: email.decryptions[0]?.decryptedAt,
        successfulDecryptions: email.decryptions.filter(d => d.success).length,
      });
    } else {
      // 获取整体加密统计
      const totalEmails = await db.email.count();
      const encryptedEmails = await db.email.count({
        where: { isEncrypted: true }
      });

      const algorithmStats = await db.email.groupBy({
        by: ['encryptionAlgorithm'],
        where: { isEncrypted: true },
        _count: { id: true },
      });

      const recentEncryptions = await db.emailEncryption.findMany({
        orderBy: { encryptedAt: 'desc' },
        take: 10,
        include: {
          email: {
            select: {
              id: true,
              fromAddress: true,
              toAddress: true,
            }
          }
        }
      });

      const encryptionFailures = await db.emailDecryption.count({
        where: { success: false }
      });

      return NextResponse.json({
        statistics: {
          totalEmails,
          encryptedEmails,
          encryptionRate: totalEmails > 0 ? (encryptedEmails / totalEmails * 100).toFixed(2) : 0,
          algorithmDistribution: algorithmStats.reduce((acc, stat) => {
            if (stat.encryptionAlgorithm) {
              acc[stat.encryptionAlgorithm] = stat._count.id;
            }
            return acc;
          }, {} as Record<string, number>),
          encryptionFailures,
        },
        recentActivity: recentEncryptions.map(enc => ({
          id: enc.id,
          emailId: enc.emailId,
          algorithm: enc.algorithm,
          encryptedAt: enc.encryptedAt,
          fromAddress: enc.email.fromAddress,
          toAddress: enc.email.toAddress,
        }))
      });
    }

  } catch (error) {
    console.error('Encryption status error:', error);
    return NextResponse.json(
      { error: '获取加密状态失败' },
      { status: 500 }
    );
  }
}