import { render, screen } from '@testing-library/react';
import AccountingPage from './page';

jest.mock('next/link', () => {
    return ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>;
});

jest.mock('lucide-react', () => ({
    ArrowRight: () => <span data-testid="icon-arrow-right" />,
    BookOpen: () => <span data-testid="icon-book-open" />,
    Calculator: () => <span data-testid="icon-calculator" />,
    ClipboardList: () => <span data-testid="icon-clipboard-list" />,
    FileText: () => <span data-testid="icon-file-text" />,
}));

describe('AccountingPage — Story 30.1', () => {
    it('renders the accounting landing page with core navigation cards', () => {
        render(<AccountingPage />);

        expect(screen.getByText('Financial Ledgers & Core Accounting')).toBeInTheDocument();
        expect(screen.getByText('Chart of Accounts')).toBeInTheDocument();
        expect(screen.getByText('Voucher Entry')).toBeInTheDocument();
        expect(screen.getByText('Journal')).toBeInTheDocument();
        expect(screen.getByText('Ledger')).toBeInTheDocument();
    });
});