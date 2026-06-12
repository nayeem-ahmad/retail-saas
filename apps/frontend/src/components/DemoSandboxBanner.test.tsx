import { fireEvent, render, screen } from '@testing-library/react';
import DemoSandboxBanner from './DemoSandboxBanner';

jest.mock('next/link', () => ({
    __esModule: true,
    default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

describe('DemoSandboxBanner', () => {
    it('renders sandbox message and signup CTA', () => {
        render(<DemoSandboxBanner onDismiss={jest.fn()} />);

        expect(screen.getByText(/demo sandbox/i)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /create your workspace/i })).toHaveAttribute('href', '/signup');
    });

    it('calls onDismiss when closed', () => {
        const onDismiss = jest.fn();
        render(<DemoSandboxBanner onDismiss={onDismiss} />);

        fireEvent.click(screen.getByRole('button', { name: /dismiss demo banner/i }));
        expect(onDismiss).toHaveBeenCalled();
    });
});