import { NextRequest } from 'next/server';
import { GET } from '@/app/api/analytics/route';

// Mock Prisma
const mockPrisma = {
  email: {
    count: jest.fn(),
    groupBy: jest.fn(),
    findMany: jest.fn(),
  },
  emailAddress: {
    count: jest.fn(),
    findMany: jest.fn(),
  },
};

jest.mock('@/lib/db', () => ({
  db: mockPrisma,
}));

describe('/api/analytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    test('should return analytics data for default period', async () => {
      // Mock database responses
      mockPrisma.email.count
        .mockResolvedValueOnce(100) // totalEmails
        .mockResolvedValueOnce(25)  // todayEmails
        .mockResolvedValueOnce(75)  // weeklyEmails
        .mockResolvedValueOnce(90)  // monthlyEmails
        .mockResolvedValueOnce(100); // for senderStats

      mockPrisma.email.groupBy
        .mockResolvedValueOnce([ // senderData
          { fromDomain: 'example.com', _count: { id: 50 } },
          { fromDomain: 'test.com', _count: { id: 30 } },
        ])
        .mockResolvedValueOnce([ // totalSenders
          { from: 'user1@example.com' },
          { from: 'user2@example.com' },
        ])
        .mockResolvedValueOnce([ // uniqueDomains
          { fromDomain: 'example.com' },
          { fromDomain: 'test.com' },
        ])
        .mockResolvedValueOnce([ // categories
          { category: 'verification', _count: { id: 40 } },
          { category: 'notification', _count: { id: 35 } },
        ])
        .mockResolvedValueOnce([ // dailyTrend
          { createdAt: new Date('2023-01-01'), _count: { id: 10 } },
          { createdAt: new Date('2023-01-02'), _count: { id: 15 } },
        ]);

      mockPrisma.email.findMany
        .mockResolvedValueOnce([ // hourlyData
          { createdAt: new Date('2023-01-01T09:00:00Z') },
          { createdAt: new Date('2023-01-01T14:00:00Z') },
        ])
        .mockResolvedValueOnce([ // for pattern analysis
          { textContent: 'Short text', htmlContent: null },
          { textContent: 'A much longer email content that exceeds 100 characters and should be classified as medium length', htmlContent: null },
        ])
        .mockResolvedValueOnce([ // for security analysis
          {
            fromAddress: 'test@example.com',
            fromDomain: 'example.com',
            subject: 'Test email',
            textContent: 'Normal content',
            htmlContent: null,
            attachments: [],
          },
        ])
        .mockResolvedValueOnce([ // for performance analysis
          {
            createdAt: new Date('2023-01-01T09:00:00Z'),
            receivedAt: new Date('2023-01-01T09:00:01Z'),
            size: 1024,
          },
        ]);

      mockPrisma.emailAddress.count
        .mockResolvedValueOnce(5)  // activeMailboxes
        .mockResolvedValueOnce(10) // totalMailboxes
        .mockResolvedValueOnce(2); // extensionCount

      mockPrisma.emailAddress.findMany
        .mockResolvedValueOnce([ // mailboxData
          {
            createdAt: new Date('2023-01-01'),
            expiresAt: new Date('2023-01-02'),
          },
        ]);

      const request = new NextRequest('http://localhost:3000/api/analytics?period=7d');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('emailStats');
      expect(data).toHaveProperty('senderStats');
      expect(data).toHaveProperty('categoryStats');
      expect(data).toHaveProperty('timeStats');
      expect(data).toHaveProperty('mailboxStats');
      expect(data).toHaveProperty('usageStats');
      expect(data).toHaveProperty('patternAnalysis');
      expect(data).toHaveProperty('securityAnalysis');
      expect(data).toHaveProperty('performanceAnalysis');

      expect(data.emailStats.totalEmails).toBe(100);
      expect(data.senderStats.topSenders).toHaveLength(2);
    });

    test('should handle different time periods', async () => {
      mockPrisma.email.count.mockResolvedValue(50);
      mockPrisma.email.groupBy.mockResolvedValue([]);
      mockPrisma.email.findMany.mockResolvedValue([]);
      mockPrisma.emailAddress.count.mockResolvedValue(5);
      mockPrisma.emailAddress.findMany.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/analytics?period=30d');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockPrisma.email.count).toHaveBeenCalled();
    });

    test('should handle database errors gracefully', async () => {
      mockPrisma.email.count.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/analytics');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toHaveProperty('error');
    });
  });
});