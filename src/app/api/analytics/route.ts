import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '7d'
    
    // 计算日期范围
    const now = new Date()
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    
    // 获取邮件统计数据
    const emailStats = await getEmailStats(startDate, now)
    
    // 获取发件人统计数据
    const senderStats = await getSenderStats(startDate, now)
    
    // 获取分类统计数据
    const categoryStats = await getCategoryStats(startDate, now)
    
    // 获取时间统计数据
    const timeStats = await getTimeStats(startDate, now)
    
    // 获取邮箱统计数据
    const mailboxStats = await getMailboxStats(startDate, now)
    
    // 获取使用统计数据
    const usageStats = await getUsageStats(startDate, now)
    
    // 获取邮件模式分析
    const patternAnalysis = await getPatternAnalysis(startDate, now)
    
    // 获取安全威胁分析
    const securityAnalysis = await getSecurityAnalysis(startDate, now)
    
    // 获取性能分析
    const performanceAnalysis = await getPerformanceAnalysis(startDate, now)
    
    const analyticsData = {
      emailStats,
      senderStats,
      categoryStats,
      timeStats,
      mailboxStats,
      usageStats,
      patternAnalysis,
      securityAnalysis,
      performanceAnalysis
    }
    
    return NextResponse.json(analyticsData)
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
}

async function getEmailStats(startDate: Date, endDate: Date) {
  const totalEmails = await prisma.email.count({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    }
  })
  
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  
  const todayEmails = await prisma.email.count({
    where: {
      createdAt: {
        gte: todayStart
      }
    }
  })
  
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - 7)
  
  const weeklyEmails = await prisma.email.count({
    where: {
      createdAt: {
        gte: weekStart
      }
    }
  })
  
  const monthStart = new Date()
  monthStart.setDate(monthStart.getDate() - 30)
  
  const monthlyEmails = await prisma.email.count({
    where: {
      createdAt: {
        gte: monthStart
      }
    }
  })
  
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const averagePerDay = totalEmails / days
  
  return {
    totalEmails,
    todayEmails,
    weeklyEmails,
    monthlyEmails,
    averagePerDay: Math.round(averagePerDay * 10) / 10
  }
}

async function getSenderStats(startDate: Date, endDate: Date) {
  const senderData = await prisma.email.groupBy({
    by: ['fromDomain'],
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    _count: {
      id: true
    },
    orderBy: {
      _count: {
        id: 'desc'
      }
    },
    take: 5
  })
  
  const totalEmails = await prisma.email.count({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    }
  })
  
  const totalSenders = await prisma.email.groupBy({
    by: ['fromAddress'],
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    }
  })
  
  const uniqueDomains = await prisma.email.groupBy({
    by: ['fromDomain'],
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    }
  })
  
  const topSenders = senderData.map(item => ({
    domain: item.fromDomain || 'unknown',
    count: item._count.id,
    percentage: Math.round((item._count.id / totalEmails) * 1000) / 10
  }))
  
  return {
    topSenders,
    totalSenders: totalSenders.length,
    uniqueDomains: uniqueDomains.length
  }
}

async function getCategoryStats(startDate: Date, endDate: Date) {
  const categories = await prisma.email.groupBy({
    by: ['category'],
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    _count: {
      id: true
    }
  })
  
  const categoryStats = {
    verification: 0,
    notification: 0,
    marketing: 0,
    security: 0,
    other: 0
  }
  
  categories.forEach(item => {
    const category = item.category as keyof typeof categoryStats
    if (category && category in categoryStats) {
      categoryStats[category] = item._count.id
    } else {
      categoryStats.other += item._count.id
    }
  })
  
  return categoryStats
}

async function getTimeStats(startDate: Date, endDate: Date) {
  // 获取每日趋势
  const dailyTrend = await prisma.email.groupBy({
    by: ['createdAt'],
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    _count: {
      id: true
    }
  })
  
  // 处理每日数据
  const dailyData = new Map<string, number>()
  dailyTrend.forEach(item => {
    const date = item.createdAt.toISOString().split('T')[0]
    dailyData.set(date, (dailyData.get(date) || 0) + item._count.id)
  })
  
  const dailyTrendArray = Array.from(dailyData.entries()).map(([date, count]) => ({
    date,
    count
  }))
  
  // 获取小时分布
  const hourlyDistribution = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: 0
  }))
  
  const hourlyData = await prisma.email.findMany({
    select: {
      createdAt: true
    },
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    }
  })
  
  hourlyData.forEach(item => {
    const hour = item.createdAt.getHours()
    hourlyDistribution[hour].count++
  })
  
  return {
    hourlyDistribution,
    dailyTrend: dailyTrendArray
  }
}

async function getMailboxStats(startDate: Date, endDate: Date) {
  const activeMailboxes = await prisma.emailAddress.count({
    where: {
      expiresAt: {
        gt: new Date()
      }
    }
  })
  
  const totalMailboxes = await prisma.emailAddress.count({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    }
  })
  
  const mailboxData = await prisma.emailAddress.findMany({
    select: {
      createdAt: true,
      expiresAt: true
    },
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    }
  })
  
  const totalLifetime = mailboxData.reduce((sum, mailbox) => {
    const lifetime = mailbox.expiresAt.getTime() - mailbox.createdAt.getTime()
    return sum + lifetime
  }, 0)
  
  const averageLifetime = totalLifetime / (mailboxData.length || 1) / (1000 * 60) // 转换为分钟
  
  // 获取续期次数 (如果有相关表)
  const extensionCount = await prisma.emailAddress.count({
    where: {
      renewalCount: {
        gt: 0
      }
    }
  })
  
  return {
    activeMailboxes,
    totalMailboxes,
    averageLifetime: Math.round(averageLifetime),
    extensionCount
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function getUsageStats(_startDate: Date, _endDate: Date) {
  // 这些统计需要根据实际的使用日志表来获取
  // 目前返回模拟数据，实际项目中应该从日志表获取
  
  return {
    searchQueries: 0, // 从搜索日志获取
    exportCount: 0,   // 从导出日志获取
    forwardCount: 0,  // 从转发日志获取
    shareCount: 0,    // 从分享日志获取
    batchOperations: 0 // 从批量操作日志获取
  }
}

async function getPatternAnalysis(startDate: Date, endDate: Date) {
  // 发送频率分析
  const emailsByHour = await prisma.email.groupBy({
    by: ['createdAt'],
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    _count: { id: true }
  });

  // 计算发送模式
  const hourlyPatterns = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }));
  emailsByHour.forEach(item => {
    const hour = item.createdAt.getHours();
    hourlyPatterns[hour].count += item._count.id;
  });

  // 识别高峰时段
  const peakHours = hourlyPatterns
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map(h => h.hour);

  // 邮件长度分析
  const emailLengths = await prisma.email.findMany({
    select: {
      textContent: true,
      htmlContent: true
    },
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    }
  });

  const lengthStats = emailLengths.reduce((acc, email) => {
    const length = (email.textContent || email.htmlContent || '').length;
    if (length < 100) acc.short++;
    else if (length < 1000) acc.medium++;
    else acc.long++;
    return acc;
  }, { short: 0, medium: 0, long: 0 });

  // 发件人活跃度分析
  const senderActivity = await prisma.email.groupBy({
    by: ['fromAddress'],
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    _count: { id: true },
    orderBy: {
      _count: { id: 'desc' }
    },
    take: 10
  });

  // 重复邮件检测
  const duplicateSubjects = await prisma.email.groupBy({
    by: ['subject'],
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      },
      subject: {
        not: null
      }
    },
    _count: { id: true },
    having: {
      id: {
        _count: {
          gt: 1
        }
      }
    }
  });

  return {
    hourlyPatterns,
    peakHours,
    lengthDistribution: lengthStats,
    topActiveSenders: senderActivity.map(s => ({
      address: s.fromAddress,
      count: s._count.id
    })),
    duplicateCount: duplicateSubjects.length,
    totalEmails: emailsByHour.reduce((sum, item) => sum + item._count.id, 0)
  };
}

async function getSecurityAnalysis(startDate: Date, endDate: Date) {
  // 获取所有邮件进行分析
  const emails = await prisma.email.findMany({
    select: {
      fromAddress: true,
      fromDomain: true,
      subject: true,
      textContent: true,
      htmlContent: true,
      attachments: {
        select: {
          filename: true,
          contentType: true
        }
      }
    },
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    }
  });

  // 可疑域名检测
  const suspiciousDomains = [
    'tempmail.com', 'guerrillamail.com', '10minutemail.com',
    'mailinator.com', 'yopmail.com'
  ];
  
  const suspiciousEmails = emails.filter(email => 
    suspiciousDomains.some(domain => 
      email.fromDomain?.includes(domain) || 
      email.fromAddress?.includes(domain)
    )
  );

  // 垃圾邮件关键词检测
  const spamKeywords = [
    'urgent', 'act now', 'limited time', 'free money', 'guaranteed',
    'click here', 'congratulations', 'winner', 'lottery', 'prize'
  ];

  const spamEmails = emails.filter(email => {
    const content = (email.subject + ' ' + email.textContent + ' ' + email.htmlContent).toLowerCase();
    return spamKeywords.some(keyword => content.includes(keyword.toLowerCase()));
  });

  // 可疑附件检测
  const dangerousExtensions = ['.exe', '.scr', '.bat', '.com', '.pif', '.vbs', '.js'];
  const suspiciousAttachments = emails.filter(email =>
    email.attachments.some(att =>
      dangerousExtensions.some(ext => att.filename.toLowerCase().endsWith(ext))
    )
  );

  // 钓鱼邮件检测
  const phishingKeywords = ['verify account', 'suspend', 'click to confirm', 'update payment'];
  const phishingEmails = emails.filter(email => {
    const content = (email.subject + ' ' + email.textContent).toLowerCase();
    return phishingKeywords.some(keyword => content.includes(keyword.toLowerCase()));
  });

  // 异常发送频率检测
  const senderFrequency = emails.reduce((acc, email) => {
    acc[email.fromAddress] = (acc[email.fromAddress] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const highFrequencySenders = Object.entries(senderFrequency)
    .filter(([, count]) => count > 10)
    .map(([address, count]) => ({ address, count }));

  return {
    totalEmails: emails.length,
    suspiciousEmails: suspiciousEmails.length,
    spamEmails: spamEmails.length,
    phishingEmails: phishingEmails.length,
    suspiciousAttachments: suspiciousAttachments.length,
    highFrequencySenders: highFrequencySenders.length,
    riskScore: Math.min(100, Math.round(
      (suspiciousEmails.length + spamEmails.length + phishingEmails.length) / emails.length * 100
    )),
    recommendations: generateSecurityRecommendations({
      suspiciousEmails: suspiciousEmails.length,
      spamEmails: spamEmails.length,
      phishingEmails: phishingEmails.length,
      suspiciousAttachments: suspiciousAttachments.length
    })
  };
}

async function getPerformanceAnalysis(startDate: Date, endDate: Date) {
  // 邮件处理时间分析
  const emails = await prisma.email.findMany({
    select: {
      createdAt: true,
      receivedAt: true,
      size: true
    },
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    }
  });

  // 计算处理延迟
  const processingTimes = emails
    .map(email => email.receivedAt.getTime() - email.createdAt.getTime())
    .filter(time => time >= 0 && time < 60000); // 过滤异常值

  const avgProcessingTime = processingTimes.length > 0 
    ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
    : 0;

  // 邮件大小分析
  const validSizes = emails
    .map(email => email.size || 0)
    .filter(size => size > 0);

  const avgEmailSize = validSizes.length > 0
    ? validSizes.reduce((sum, size) => sum + size, 0) / validSizes.length
    : 0;

  // 存储使用情况
  const totalStorage = validSizes.reduce((sum, size) => sum + size, 0);

  // 系统负载分析（基于邮件数量）
  const dailyLoads = emails.reduce((acc, email) => {
    const date = email.createdAt.toISOString().split('T')[0];
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const loads = Object.values(dailyLoads);
  const maxLoad = Math.max(...loads, 0);
  const avgLoad = loads.length > 0 ? loads.reduce((sum, load) => sum + load, 0) / loads.length : 0;

  // 邮箱使用效率
  const activeMailboxes = await prisma.emailAddress.count({
    where: {
      expiresAt: { gt: new Date() }
    }
  });

  const emailsPerMailbox = activeMailboxes > 0 ? emails.length / activeMailboxes : 0;

  return {
    processingMetrics: {
      avgProcessingTime: Math.round(avgProcessingTime),
      totalProcessed: emails.length,
      processingEfficiency: Math.min(100, Math.max(0, 100 - (avgProcessingTime / 1000) * 10))
    },
    storageMetrics: {
      totalStorage: Math.round(totalStorage / 1024 / 1024 * 100) / 100, // MB
      avgEmailSize: Math.round(avgEmailSize / 1024 * 100) / 100, // KB
      storageEfficiency: avgEmailSize < 50000 ? 'Good' : avgEmailSize < 100000 ? 'Fair' : 'Poor'
    },
    loadMetrics: {
      maxDailyLoad: maxLoad,
      avgDailyLoad: Math.round(avgLoad * 10) / 10,
      loadVariance: loads.length > 0 ? Math.round(Math.sqrt(
        loads.reduce((sum, load) => sum + Math.pow(load - avgLoad, 2), 0) / loads.length
      ) * 10) / 10 : 0
    },
    utilizationMetrics: {
      emailsPerMailbox: Math.round(emailsPerMailbox * 10) / 10,
      mailboxUtilization: Math.min(100, emailsPerMailbox * 10)
    }
  };
}

function generateSecurityRecommendations(threats: {
  suspiciousEmails: number;
  spamEmails: number;
  phishingEmails: number;
  suspiciousAttachments: number;
}) {
  const recommendations = [];

  if (threats.suspiciousEmails > 0) {
    recommendations.push('建议启用发件人域名验证');
  }
  
  if (threats.spamEmails > 5) {
    recommendations.push('建议实施更严格的垃圾邮件过滤');
  }
  
  if (threats.phishingEmails > 0) {
    recommendations.push('建议添加钓鱼邮件警告标识');
  }
  
  if (threats.suspiciousAttachments > 0) {
    recommendations.push('建议禁用或扫描可执行文件附件');
  }

  if (recommendations.length === 0) {
    recommendations.push('系统安全状况良好');
  }

  return recommendations;
}