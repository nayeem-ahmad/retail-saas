import { fireEvent, render, screen } from '@testing-library/react';
import { ContextualHelpPanel } from './ContextualHelpPanel';

jest.mock('next/link', () => ({
    __esModule: true,
    default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

const HELP = {
    panelKey: 'help-dismissed-test-panel',
    title: 'Test quick guide',
    summary: 'Summary for testers.',
    steps: ['Step one', 'Step two'],
    learnMoreHref: '/help',
};

describe('ContextualHelpPanel', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('renders summary and steps', () => {
        render(<ContextualHelpPanel {...HELP} />);
        expect(screen.getByText('Test quick guide')).toBeInTheDocument();
        expect(screen.getByText('Summary for testers.')).toBeInTheDocument();
        expect(screen.getByText('Step one')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /more in help center/i })).toHaveAttribute('href', '/help');
    });

    it('dismisses and can be restored', () => {
        render(<ContextualHelpPanel {...HELP} />);
        fireEvent.click(screen.getByRole('button', { name: 'Dismiss help' }));
        expect(screen.queryByText('Summary for testers.')).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /show test quick guide/i }));
        expect(screen.getByText('Summary for testers.')).toBeInTheDocument();
    });

    it('collapses step list', () => {
        render(<ContextualHelpPanel {...HELP} />);
        fireEvent.click(screen.getByRole('button', { name: 'Collapse help' }));
        expect(screen.queryByText('Step one')).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Expand help' }));
        expect(screen.getByText('Step one')).toBeInTheDocument();
    });
});