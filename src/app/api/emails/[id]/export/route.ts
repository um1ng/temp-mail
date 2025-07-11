import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Parser } from 'json2csv';
import * as XLSX from 'xlsx';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: emailId } = await context.params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'txt';

    // 获取邮件数据
    const email = await db.email.findUnique({
      where: { id: emailId },
      include: {
        emailAddress: true,
        attachments: true,
      },
    });

    if (!email) {
      return NextResponse.json(
        { error: '邮件不存在' },
        { status: 404 }
      );
    }

    let content: string | Buffer = '';
    let contentType = 'text/plain';
    let filename = `email_${emailId}`;

    switch (format) {
      case 'txt':
        content = generateTextFormat(email);
        contentType = 'text/plain';
        filename += '.txt';
        break;
      
      case 'html':
        content = generateHtmlFormat(email);
        contentType = 'text/html';
        filename += '.html';
        break;
      
      case 'eml':
        content = generateEmlFormat(email);
        contentType = 'message/rfc822';
        filename += '.eml';
        break;
      
      case 'json':
        content = generateJsonFormat(email);
        contentType = 'application/json';
        filename += '.json';
        break;
      
      case 'pdf':
        content = await generatePdfFormat(email);
        contentType = 'application/pdf';
        filename += '.pdf';
        break;
      
      case 'csv':
        content = generateCsvFormat(email);
        contentType = 'text/csv';
        filename += '.csv';
        break;
        
      case 'xlsx':
        content = generateXlsxFormat(email);
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        filename += '.xlsx';
        break;
        
      case 'xml':
        content = generateXmlFormat(email);
        contentType = 'application/xml';
        filename += '.xml';
        break;
        
      case 'md':
        content = generateMarkdownFormat(email);
        contentType = 'text/markdown';
        filename += '.md';
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
      },
    });
  } catch (error) {
    console.error('Error exporting email:', error);
    return NextResponse.json(
      { error: '导出失败' },
      { status: 500 }
    );
  }
}

function generateTextFormat(email: {
  subject?: string | null;
  fromAddress: string;
  toAddress: string;
  receivedAt: Date;
  textContent?: string | null;
  htmlContent?: string | null;
  attachments: Array<{ filename: string }>;
}): string {
  return `
主题: ${email.subject || '(无主题)'}
发件人: ${email.fromAddress}
收件人: ${email.toAddress}
时间: ${email.receivedAt.toLocaleString('zh-CN')}
${email.attachments.length > 0 ? `附件: ${email.attachments.map((a) => a.filename).join(', ')}` : ''}

内容:
${email.textContent || email.htmlContent || '(无内容)'}
`.trim();
}

function generateHtmlFormat(email: {
  subject?: string | null;
  fromAddress: string;
  toAddress: string;
  receivedAt: Date;
  textContent?: string | null;
  htmlContent?: string | null;
  attachments: Array<{ filename: string }>;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${email.subject || '(无主题)'}</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background-color: #f5f5f5;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white;
            padding: 30px; 
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .meta { 
            margin-top: 20px;
            font-size: 14px; 
            opacity: 0.9;
        }
        .meta-item {
            display: flex;
            margin-bottom: 8px;
        }
        .meta-label {
            font-weight: 600;
            min-width: 80px;
        }
        .content { 
            padding: 30px; 
            line-height: 1.6;
        }
        .attachments {
            margin-top: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
        }
        .attachment-list {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }
        .attachment-item {
            background: white;
            padding: 8px 12px;
            border-radius: 4px;
            border: 1px solid #e0e0e0;
            font-size: 14px;
        }
        .footer {
            padding: 20px 30px;
            background: #f8f9fa;
            border-top: 1px solid #e0e0e0;
            font-size: 12px;
            color: #666;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${email.subject || '(无主题)'}</h1>
            <div class="meta">
                <div class="meta-item">
                    <span class="meta-label">发件人:</span>
                    <span>${email.fromAddress}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">收件人:</span>
                    <span>${email.toAddress}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">时间:</span>
                    <span>${email.receivedAt.toLocaleString('zh-CN')}</span>
                </div>
            </div>
        </div>
        <div class="content">
            ${email.htmlContent || email.textContent?.replace(/\n/g, '<br>') || '(无内容)'}
        </div>
        ${email.attachments.length > 0 ? `
        <div class="attachments">
            <h3 style="margin: 0 0 10px 0; font-size: 16px;">附件 (${email.attachments.length})</h3>
            <div class="attachment-list">
                ${email.attachments.map(a => `<div class="attachment-item">📎 ${a.filename}</div>`).join('')}
            </div>
        </div>
        ` : ''}
        <div class="footer">
            导出时间: ${new Date().toLocaleString('zh-CN')} | 临时邮箱系统
        </div>
    </div>
</body>
</html>
`.trim();
}

function generateEmlFormat(email: {
  subject?: string | null;
  fromAddress: string;
  toAddress: string;
  receivedAt: Date;
  textContent?: string | null;
  htmlContent?: string | null;
  attachments: Array<{ filename: string }>;
}): string {
  const messageId = `<${Date.now()}@tempmail.local>`;
  const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  let emlContent = `Message-ID: ${messageId}
From: ${email.fromAddress}
To: ${email.toAddress}
Subject: ${email.subject || '(无主题)'}
Date: ${email.receivedAt.toUTCString()}
MIME-Version: 1.0`;

  if (email.htmlContent && email.textContent) {
    // 多部分邮件
    emlContent += `
Content-Type: multipart/alternative; boundary="${boundary}"

--${boundary}
Content-Type: text/plain; charset=utf-8
Content-Transfer-Encoding: 8bit

${email.textContent}

--${boundary}
Content-Type: text/html; charset=utf-8
Content-Transfer-Encoding: 8bit

${email.htmlContent}

--${boundary}--`;
  } else if (email.htmlContent) {
    emlContent += `
Content-Type: text/html; charset=utf-8
Content-Transfer-Encoding: 8bit

${email.htmlContent}`;
  } else {
    emlContent += `
Content-Type: text/plain; charset=utf-8
Content-Transfer-Encoding: 8bit

${email.textContent || '(无内容)'}`;
  }

  return emlContent.trim();
}

function generateJsonFormat(email: {
  id?: string;
  subject?: string | null;
  fromAddress: string;
  toAddress: string;
  receivedAt: Date;
  textContent?: string | null;
  htmlContent?: string | null;
  attachments: Array<{ filename: string; size?: number | null }>;
}): string {
  return JSON.stringify({
    id: email.id,
    subject: email.subject || null,
    from: email.fromAddress,
    to: email.toAddress,
    receivedAt: email.receivedAt.toISOString(),
    content: {
      text: email.textContent || null,
      html: email.htmlContent || null,
    },
    attachments: email.attachments.map(att => ({
      filename: att.filename,
      size: att.size || null,
    })),
    exportedAt: new Date().toISOString(),
    exportFormat: 'json',
  }, null, 2);
}

async function generatePdfFormat(email: {
  subject?: string | null;
  fromAddress: string;
  toAddress: string;
  receivedAt: Date;
  textContent?: string | null;
  htmlContent?: string | null;
  attachments: Array<{ filename: string }>;
}): Promise<Buffer> {
  // For now, generate PDF as HTML and return as text
  // In production, you would use a proper PDF library
  
  try {
    // Simplified PDF generation - just return HTML as buffer
    // In production, replace this with actual PDF generation
    const pdfHeader = `%PDF-1.4
%Email Export - ${email.subject || '(无主题)'}
`;
    const fallbackContent = generateTextFormat(email);
    return Buffer.from(pdfHeader + fallbackContent, 'utf-8');
  } catch (error) {
    console.error('PDF generation error:', error);
    // If PDF generation fails, return a simple text content
    const fallbackContent = generateTextFormat(email);
    return Buffer.from(fallbackContent, 'utf-8');
  }
}

function generateCsvFormat(email: {
  id?: string;
  subject?: string | null;
  fromAddress: string;
  toAddress: string;
  receivedAt: Date;
  textContent?: string | null;
  htmlContent?: string | null;
  attachments: Array<{ filename: string; size?: number | null }>;
}): string {
  const data = [{
    邮件ID: email.id || '',
    主题: email.subject || '(无主题)',
    发件人: email.fromAddress,
    收件人: email.toAddress,
    接收时间: email.receivedAt.toLocaleString('zh-CN'),
    文本内容: email.textContent || '',
    HTML内容: email.htmlContent || '',
    附件数量: email.attachments.length,
    附件列表: email.attachments.map(a => a.filename).join('; '),
    导出时间: new Date().toLocaleString('zh-CN'),
  }];

  const parser = new Parser({
    fields: [
      '邮件ID', '主题', '发件人', '收件人', '接收时间',
      '文本内容', 'HTML内容', '附件数量', '附件列表', '导出时间'
    ]
  });

  return parser.parse(data);
}

function generateXlsxFormat(email: {
  id?: string;
  subject?: string | null;
  fromAddress: string;
  toAddress: string;
  receivedAt: Date;
  textContent?: string | null;
  htmlContent?: string | null;
  attachments: Array<{ filename: string; size?: number | null }>;
}): Buffer {
  const workbook = XLSX.utils.book_new();
  
  // 邮件基本信息
  const emailData = [
    ['邮件ID', email.id || ''],
    ['主题', email.subject || '(无主题)'],
    ['发件人', email.fromAddress],
    ['收件人', email.toAddress],
    ['接收时间', email.receivedAt.toLocaleString('zh-CN')],
    ['导出时间', new Date().toLocaleString('zh-CN')],
  ];
  
  const emailSheet = XLSX.utils.aoa_to_sheet(emailData);
  XLSX.utils.book_append_sheet(workbook, emailSheet, '邮件信息');
  
  // 邮件内容
  const contentData = [
    ['内容类型', '内容'],
    ['文本内容', email.textContent || ''],
    ['HTML内容', email.htmlContent || ''],
  ];
  
  const contentSheet = XLSX.utils.aoa_to_sheet(contentData);
  XLSX.utils.book_append_sheet(workbook, contentSheet, '邮件内容');
  
  // 附件信息
  if (email.attachments.length > 0) {
    const attachmentData = [
      ['序号', '附件名称', '文件大小'],
      ...email.attachments.map((att, index) => [
        index + 1,
        att.filename,
        att.size ? `${att.size} bytes` : '未知'
      ])
    ];
    
    const attachmentSheet = XLSX.utils.aoa_to_sheet(attachmentData);
    XLSX.utils.book_append_sheet(workbook, attachmentSheet, '附件列表');
  }
  
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

function generateXmlFormat(email: {
  id?: string;
  subject?: string | null;
  fromAddress: string;
  toAddress: string;
  receivedAt: Date;
  textContent?: string | null;
  htmlContent?: string | null;
  attachments: Array<{ filename: string; size?: number | null }>;
}): string {
  const escapeXml = (text: string) => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  return `<?xml version="1.0" encoding="UTF-8"?>
<email>
  <id>${email.id || ''}</id>
  <subject>${escapeXml(email.subject || '(无主题)')}</subject>
  <from>${escapeXml(email.fromAddress)}</from>
  <to>${escapeXml(email.toAddress)}</to>
  <receivedAt>${email.receivedAt.toISOString()}</receivedAt>
  <content>
    <text><![CDATA[${email.textContent || ''}]]></text>
    <html><![CDATA[${email.htmlContent || ''}]]></html>
  </content>
  <attachments count="${email.attachments.length}">
    ${email.attachments.map(att => `
    <attachment>
      <filename>${escapeXml(att.filename)}</filename>
      <size>${att.size || 0}</size>
    </attachment>`).join('')}
  </attachments>
  <exportedAt>${new Date().toISOString()}</exportedAt>
</email>`;
}

function generateMarkdownFormat(email: {
  subject?: string | null;
  fromAddress: string;
  toAddress: string;
  receivedAt: Date;
  textContent?: string | null;
  htmlContent?: string | null;
  attachments: Array<{ filename: string }>;
}): string {
  const attachmentsList = email.attachments.length > 0
    ? email.attachments.map(att => `- 📎 ${att.filename}`).join('\n')
    : '无附件';

  return `# ${email.subject || '(无主题)'}

## 邮件信息

| 项目 | 内容 |
|------|------|
| **发件人** | \`${email.fromAddress}\` |
| **收件人** | \`${email.toAddress}\` |
| **接收时间** | ${email.receivedAt.toLocaleString('zh-CN')} |
| **导出时间** | ${new Date().toLocaleString('zh-CN')} |

## 邮件内容

${email.textContent || email.htmlContent || '*(无内容)*'}

## 附件列表

${attachmentsList}

---

*由临时邮箱系统导出*`;
}