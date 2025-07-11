import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EmailList } from '@/components/email-list';

// Mock Next.js hooks
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/emails',
}));

// Mock 邮件数据
const mockEmails = [
  {
    id: '1',
    subject: 'Test Email 1',
    fromAddress: 'sender1@example.com',
    toAddress: 'recipient@test.com',
    receivedAt: new Date('2023-01-01T10:00:00Z'),
    isRead: false,
    isStarred: false,
    hasAttachments: false,
    textContent: 'This is test email content',
    htmlContent: null,
    category: 'notification',
    tags: ['important'],
    isEncrypted: false,
  },
  {
    id: '2',
    subject: 'Test Email 2',
    fromAddress: 'sender2@example.com',
    toAddress: 'recipient@test.com',
    receivedAt: new Date('2023-01-01T11:00:00Z'),
    isRead: true,
    isStarred: true,
    hasAttachments: true,
    textContent: 'Another test email',
    htmlContent: null,
    category: 'verification',
    tags: [],
    isEncrypted: true,
  },
];

const mockEmailAddress = {
  id: 'addr1',
  address: 'recipient@test.com',
  label: 'Test Mailbox',
  createdAt: new Date('2023-01-01'),
  expiresAt: new Date('2023-01-02'),
  isActive: true,
};

describe('EmailList Component', () => {
  const defaultProps = {
    emails: mockEmails,
    selectedEmailId: null,
    onEmailSelect: jest.fn(),
    onEmailDelete: jest.fn(),
    onEmailToggleRead: jest.fn(),
    onEmailToggleStar: jest.fn(),
    emailAddress: mockEmailAddress,
    isLoading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render email list correctly', () => {
    render(<EmailList {...defaultProps} />);

    expect(screen.getByText('Test Email 1')).toBeInTheDocument();
    expect(screen.getByText('Test Email 2')).toBeInTheDocument();
    expect(screen.getByText('sender1@example.com')).toBeInTheDocument();
    expect(screen.getByText('sender2@example.com')).toBeInTheDocument();
  });

  test('should display loading state', () => {
    render(<EmailList {...defaultProps} isLoading={true} />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  test('should display empty state when no emails', () => {
    render(<EmailList {...defaultProps} emails={[]} />);

    expect(screen.getByText(/no emails/i)).toBeInTheDocument();
  });

  test('should call onEmailSelect when email is clicked', () => {
    render(<EmailList {...defaultProps} />);

    const firstEmail = screen.getByText('Test Email 1').closest('[data-testid="email-item"]');
    expect(firstEmail).toBeInTheDocument();
    
    if (firstEmail) {
      fireEvent.click(firstEmail);
      expect(defaultProps.onEmailSelect).toHaveBeenCalledWith('1');
    }
  });

  test('should show read/unread status correctly', () => {
    render(<EmailList {...defaultProps} />);

    // First email is unread, should have unread indicator
    const unreadEmail = screen.getByText('Test Email 1').closest('[data-testid="email-item"]');
    expect(unreadEmail).toHaveClass('font-semibold'); // or whatever class indicates unread

    // Second email is read, should not have unread indicator
    const readEmail = screen.getByText('Test Email 2').closest('[data-testid="email-item"]');
    expect(readEmail).not.toHaveClass('font-semibold');
  });

  test('should show star status correctly', () => {
    render(<EmailList {...defaultProps} />);

    // Check if starred email shows star icon
    const starredEmailContainer = screen.getByText('Test Email 2').closest('[data-testid="email-item"]');
    expect(starredEmailContainer?.querySelector('[data-testid="star-icon"]')).toBeInTheDocument();
  });

  test('should show attachment indicator', () => {
    render(<EmailList {...defaultProps} />);

    const emailWithAttachment = screen.getByText('Test Email 2').closest('[data-testid="email-item"]');
    expect(emailWithAttachment?.querySelector('[data-testid="attachment-icon"]')).toBeInTheDocument();
  });

  test('should show encryption indicator', () => {
    render(<EmailList {...defaultProps} />);

    const encryptedEmail = screen.getByText('Test Email 2').closest('[data-testid="email-item"]');
    expect(encryptedEmail?.querySelector('[data-testid="encryption-icon"]')).toBeInTheDocument();
  });

  test('should call onEmailToggleRead when read button is clicked', async () => {
    render(<EmailList {...defaultProps} />);

    const readButton = screen.getAllByTestId('toggle-read-button')[0];
    fireEvent.click(readButton);

    await waitFor(() => {
      expect(defaultProps.onEmailToggleRead).toHaveBeenCalledWith('1', true);
    });
  });

  test('should call onEmailToggleStar when star button is clicked', async () => {
    render(<EmailList {...defaultProps} />);

    const starButton = screen.getAllByTestId('toggle-star-button')[0];
    fireEvent.click(starButton);

    await waitFor(() => {
      expect(defaultProps.onEmailToggleStar).toHaveBeenCalledWith('1', true);
    });
  });

  test('should call onEmailDelete when delete button is clicked', async () => {
    render(<EmailList {...defaultProps} />);

    const deleteButton = screen.getAllByTestId('delete-button')[0];
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(defaultProps.onEmailDelete).toHaveBeenCalledWith('1');
    });
  });

  test('should format date correctly', () => {
    render(<EmailList {...defaultProps} />);

    // Check if date is formatted properly
    expect(screen.getByText('10:00')).toBeInTheDocument(); // Time format
    expect(screen.getByText('11:00')).toBeInTheDocument();
  });

  test('should show category badges', () => {
    render(<EmailList {...defaultProps} />);

    expect(screen.getByText('notification')).toBeInTheDocument();
    expect(screen.getByText('verification')).toBeInTheDocument();
  });

  test('should show tags', () => {
    render(<EmailList {...defaultProps} />);

    expect(screen.getByText('important')).toBeInTheDocument();
  });

  test('should highlight selected email', () => {
    render(<EmailList {...defaultProps} selectedEmailId="1" />);

    const selectedEmail = screen.getByText('Test Email 1').closest('[data-testid="email-item"]');
    expect(selectedEmail).toHaveClass('bg-blue-50'); // or whatever class indicates selection
  });

  test('should handle email search/filtering', () => {
    const filteredEmails = mockEmails.filter(email => 
      email.subject.toLowerCase().includes('test email 1')
    );

    render(<EmailList {...defaultProps} emails={filteredEmails} />);

    expect(screen.getByText('Test Email 1')).toBeInTheDocument();
    expect(screen.queryByText('Test Email 2')).not.toBeInTheDocument();
  });

  test('should show email preview text', () => {
    render(<EmailList {...defaultProps} />);

    expect(screen.getByText(/This is test email content/)).toBeInTheDocument();
    expect(screen.getByText(/Another test email/)).toBeInTheDocument();
  });

  test('should handle long subject lines', () => {
    const emailWithLongSubject = {
      ...mockEmails[0],
      subject: 'This is a very long email subject that should be truncated when displayed in the email list component',
    };

    render(<EmailList {...defaultProps} emails={[emailWithLongSubject]} />);

    const subjectElement = screen.getByText(/This is a very long email subject/);
    expect(subjectElement).toBeInTheDocument();
    // Check if it's truncated (you might need to check CSS classes or title attribute)
  });

  test('should be accessible', () => {
    render(<EmailList {...defaultProps} />);

    // Check for proper ARIA labels and roles
    const emailItems = screen.getAllByRole('listitem');
    expect(emailItems).toHaveLength(2);

    // Check for keyboard navigation support
    const firstEmailItem = emailItems[0];
    expect(firstEmailItem).toHaveAttribute('tabIndex', '0');
  });
});