import { fireEvent, render, screen } from '@testing-library/react';
import { HelpTooltip, LabelWithHelp } from './HelpTooltip';

describe('HelpTooltip', () => {
    it('shows tooltip text on hover', () => {
        render(<HelpTooltip text="Debit increases this account." />);
        fireEvent.mouseEnter(screen.getByRole('button', { name: 'Show help' }));
        expect(screen.getByRole('tooltip')).toHaveTextContent('Debit increases this account.');
    });

    it('renders title and multiple lines', () => {
        render(<HelpTooltip title="COA" text={['Line one', 'Line two']} />);
        fireEvent.focus(screen.getByRole('button', { name: 'Help: COA' }));
        const tooltip = screen.getByRole('tooltip');
        expect(tooltip).toHaveTextContent('COA');
        expect(tooltip).toHaveTextContent('Line one');
        expect(tooltip).toHaveTextContent('Line two');
    });
});

describe('LabelWithHelp', () => {
    it('renders label with help trigger', () => {
        render(
            <LabelWithHelp label="Priority" help="Lower number wins.">
                <input aria-label="Priority" />
            </LabelWithHelp>,
        );
        expect(screen.getByText('Priority')).toBeInTheDocument();
        fireEvent.mouseEnter(screen.getByRole('button', { name: 'Show help' }));
        expect(screen.getByRole('tooltip')).toHaveTextContent('Lower number wins.');
    });
});