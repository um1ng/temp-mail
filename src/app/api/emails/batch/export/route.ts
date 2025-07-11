import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Parser } from 'json2csv';
import * as XLSX from 'xlsx';

interface EmailWithRelations {
  id: string;
  subject: string | null;
  fromAddress: string;
  toAddress: string;
  receivedAt: Date;
  readAt: Date | null;
  textContent: string | null;
  htmlContent: string | null;
  attachments: Array<{
    filename: string;
    size: number | null;
  }>;
  emailAddress: {
    id: string;
    address: string;
    label: string | null;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { emailIds, format = 'json', addressId } = body;

    if (!emailIds || !Array.isArray(emailIds) || emailIds.length === 0) {
      return NextResponse.json(
        { error: '请提供邮件ID列表' },
        { status: 400 }
      );
    }

    // 查询所有邮件
    const emails = await db.email.findMany({
      where: {
        id: { in: emailIds },
        ...(addressId && { emailAddressId: addressId }),
      },
      include: {
        emailAddress: true,
        attachments: true,
      },
    });

    if (emails.length === 0) {
      return NextResponse.json(
        { error: '未找到邮件' },
        { status: 404 }
      );
    }

    let content: string | Buffer = '';
    let contentType = 'application/json';
    let filename = `emails_batch_${Date.now()}`;

    switch (format) {
      case 'json':
        content = generateBatchJsonFormat(emails);
        contentType = 'application/json';
        filename += '.json';
        break;

      case 'csv':
        content = generateBatchCsvFormat(emails);
        contentType = 'text/csv';
        filename += '.csv';
        break;

      case 'xlsx':
        content = generateBatchXlsxFormat(emails);
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        filename += '.xlsx';
        break;

      case 'xml':
        content = generateBatchXmlFormat(emails);
        contentType = 'application/xml';
        filename += '.xml';
        break;

      default:
        return NextResponse.json(
          { error: '不支持的导出格式' },
          { status: 400 }
        );
    }

    return new NextResponse(content, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error batch exporting emails:', error);
    return NextResponse.json(
      { error: '批量导出失败' },
      { status: 500 }
    );
  }
}

function generateBatchJsonFormat(emails: EmailWithRelations[]): string {
  return JSON.stringify({
    exportInfo: {
      totalEmails: emails.length,
      exportedAt: new Date().toISOString(),
      format: 'json',
    },
    emails: emails.map(email => ({
      id: email.id,
      subject: email.subject || null,
      from: email.fromAddress,
      to: email.toAddress,
      receivedAt: email.receivedAt.toISOString(),
      readAt: email.readAt?.toISOString() || null,
      content: {
        text: email.textContent || null,
        html: email.htmlContent || null,
      },
      attachments: email.attachments.map((att) => ({
        filename: att.filename,
        size: att.size || null,
      })),
      emailAddress: {
        id: email.emailAddress.id,
        address: email.emailAddress.address,
        label: email.emailAddress.label,
      },
    })),
  }, null, 2);
}

function generateBatchCsvFormat(emails: EmailWithRelations[]): string {
  const data = emails.map(email => ({
    邮件ID: email.id,
    主题: email.subject || '(无主题)',
    发件人: email.fromAddress,
    收件人: email.toAddress,
    邮箱标识: email.emailAddress.label || email.emailAddress.address,
    接收时间: email.receivedAt.toLocaleString('zh-CN'),
    已读时间: email.readAt?.toLocaleString('zh-CN') || '未读',
    文本内容长度: email.textContent?.length || 0,
    HTML内容长度: email.htmlContent?.length || 0,
    附件数量: email.attachments.length,
    附件列表: email.attachments.map((a) => a.filename).join('; '),
  }));

  const parser = new Parser({
    fields: [
      '邮件ID', '主题', '发件人', '收件人', '邮箱标识', '接收时间', '已读时间',
      '文本内容长度', 'HTML内容长度', '附件数量', '附件列表'
    ]
  });

  return parser.parse(data);
}

function generateBatchXlsxFormat(emails: EmailWithRelations[]): Buffer {
  const workbook = XLSX.utils.book_new();

  // 邮件汇总信息
  const summaryData = [
    ['导出信息'],
    ['总邮件数', emails.length],
    ['导出时间', new Date().toLocaleString('zh-CN')],
    ['格式', 'Excel (XLSX)'],
    [''],
    ['邮箱分布'],
    ...Object.entries(
      emails.reduce((acc, email) => {
        const key = email.emailAddress.label || email.emailAddress.address;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([address, count]) => [address, count]),
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, '导出汇总');

  // 邮件列表
  const emailsData = [
    [
      '邮件ID', '主题', '发件人', '收件人', '邮箱标识', '接收时间', '已读时间',
      '文本内容长度', 'HTML内容长度', '附件数量'
    ],
    ...emails.map(email => [
      email.id,
      email.subject || '(无主题)',
      email.fromAddress,
      email.toAddress,
      email.emailAddress.label || email.emailAddress.address,
      email.receivedAt.toLocaleString('zh-CN'),
      email.readAt?.toLocaleString('zh-CN') || '未读',
      email.textContent?.length || 0,
      email.htmlContent?.length || 0,
      email.attachments.length,
    ])
  ];

  const emailsSheet = XLSX.utils.aoa_to_sheet(emailsData);
  XLSX.utils.book_append_sheet(workbook, emailsSheet, '邮件列表');

  // 附件统计
  const allAttachments = emails.flatMap(email => 
    email.attachments.map((att) => ({
      邮件ID: email.id,
      邮件主题: email.subject || '(无主题)',
      附件名称: att.filename,
      文件大小: att.size || 0,
    }))
  );

  if (allAttachments.length > 0) {
    const attachmentsData = [
      ['邮件ID', '邮件主题', '附件名称', '文件大小(字节)'],
      ...allAttachments.map(att => [
        att.邮件ID,
        att.邮件主题,
        att.附件名称,
        att.文件大小,
      ])
    ];

    const attachmentsSheet = XLSX.utils.aoa_to_sheet(attachmentsData);
    XLSX.utils.book_append_sheet(workbook, attachmentsSheet, '附件统计');
  }

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

function generateBatchXmlFormat(emails: EmailWithRelations[]): string {
  const escapeXml = (text: string) => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  return `<?xml version="1.0" encoding="UTF-8"?>
<emailBatch>
  <exportInfo>
    <totalEmails>${emails.length}</totalEmails>
    <exportedAt>${new Date().toISOString()}</exportedAt>
    <format>xml</format>
  </exportInfo>
  <emails>
    ${emails.map(email => `
    <email id="${email.id}">
      <subject>${escapeXml(email.subject || '(无主题)')}</subject>
      <from>${escapeXml(email.fromAddress)}</from>
      <to>${escapeXml(email.toAddress)}</to>
      <receivedAt>${email.receivedAt.toISOString()}</receivedAt>
      <readAt>${email.readAt?.toISOString() || ''}</readAt>
      <emailAddress>
        <id>${email.emailAddress.id}</id>
        <address>${escapeXml(email.emailAddress.address)}</address>
        <label>${escapeXml(email.emailAddress.label || '')}</label>
      </emailAddress>
      <content>
        <text><![CDATA[${email.textContent || ''}]]></text>
        <html><![CDATA[${email.htmlContent || ''}]]></html>
      </content>
      <attachments count="${email.attachments.length}">
        ${email.attachments.map((att) => `
        <attachment>
          <filename>${escapeXml(att.filename)}</filename>
          <size>${att.size || 0}</size>
        </attachment>`).join('')}
      </attachments>
    </email>`).join('')}
  </emails>
</emailBatch>`;
}