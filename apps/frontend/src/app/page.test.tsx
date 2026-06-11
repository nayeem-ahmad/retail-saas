import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('next/link', () => {
    const MockLink = ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) =>
        React.createElement('a', { href, ...rest }, children);
    MockLink.displayName = 'MockLink';
    return MockLink;
});

jest.mock('next/navigation', () => ({
    useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
}));

import HomePage from './page';

describe('HomePage', () => {
    it('renders the brand name in the nav', () => {
        render(<HomePage />);
        // "RetailSaaS" appears multiple times (nav + footer)
        expect(screen.getAllByText('RetailSaaS').length).toBeGreaterThan(0);
    });

    it('renders the hero tagline badge', () => {
        render(<HomePage />);
        expect(screen.getByText('Built for Bangladeshi retail businesses')).toBeInTheDocument();
    });

    it('renders the hero heading', () => {
        render(<HomePage />);
        expect(screen.getByText('Run your store.')).toBeInTheDocument();
        expect(screen.getByText('Grow your business.')).toBeInTheDocument();
    });

    it('renders the hero subtitle', () => {
        render(<HomePage />);
        expect(screen.getByText(/All-in-one retail management platform/)).toBeInTheDocument();
    });

    it('renders the hero CTA buttons', () => {
        render(<HomePage />);
        expect(screen.getAllByText('Start your free trial').length).toBeGreaterThan(0);
        expect(screen.getByText('Try Demo →')).toBeInTheDocument();
    });

    it('renders the no credit card note', () => {
        render(<HomePage />);
        expect(screen.getByText(/No credit card required/)).toBeInTheDocument();
    });

    it('renders the features section heading', () => {
        render(<HomePage />);
        expect(screen.getByText('Everything your store needs')).toBeInTheDocument();
    });

    it('renders all six feature titles', () => {
        render(<HomePage />);
        expect(screen.getByText('Point of Sale')).toBeInTheDocument();
        expect(screen.getByText('Inventory Control')).toBeInTheDocument();
        expect(screen.getByText('Sales Analytics')).toBeInTheDocument();
        expect(screen.getByText('Customer Management')).toBeInTheDocument();
        expect(screen.getByText('Integrated Payments')).toBeInTheDocument();
        expect(screen.getByText('Multi-Tenant SaaS')).toBeInTheDocument();
    });

    it('renders feature descriptions', () => {
        render(<HomePage />);
        expect(screen.getByText(/Fast, reliable POS with barcode scanning/)).toBeInTheDocument();
        expect(screen.getByText(/Accept bKash, Nagad, SSL Wireless/)).toBeInTheDocument();
    });

    it('renders the stats section', () => {
        render(<HomePage />);
        expect(screen.getByText('500+')).toBeInTheDocument();
        expect(screen.getByText('Active stores')).toBeInTheDocument();
        expect(screen.getByText('99.9%')).toBeInTheDocument();
        expect(screen.getByText('Uptime SLA')).toBeInTheDocument();
    });

    it('renders the testimonials section heading', () => {
        render(<HomePage />);
        expect(
            screen.getByText('Trusted by retailers across Bangladesh'),
        ).toBeInTheDocument();
    });

    it('renders all testimonials', () => {
        render(<HomePage />);
        expect(screen.getByText('Rahim Uddin')).toBeInTheDocument();
        expect(screen.getByText('Nasrin Begum')).toBeInTheDocument();
        expect(screen.getByText('Kamal Hossain')).toBeInTheDocument();
    });

    it('renders testimonial quotes', () => {
        render(<HomePage />);
        expect(
            screen.getByText(/Switched from paper ledgers to Retail SaaS/),
        ).toBeInTheDocument();
    });

    it('renders the pricing section heading', () => {
        render(<HomePage />);
        expect(screen.getByText('Simple, transparent pricing')).toBeInTheDocument();
    });

    it('renders both plan names in the pricing section', () => {
        render(<HomePage />);
        expect(screen.getByText('Basic')).toBeInTheDocument();
        expect(screen.getByText('Premium')).toBeInTheDocument();
    });

    it('renders plan prices', () => {
        render(<HomePage />);
        // Basic: 1499, Premium: 3999
        expect(screen.getByText(/1,499/)).toBeInTheDocument();
        expect(screen.getByText(/3,999/)).toBeInTheDocument();
    });

    it('renders "Most popular" badge on the highlighted plan', () => {
        render(<HomePage />);
        expect(screen.getByText('Most popular')).toBeInTheDocument();
    });

    it('renders the "See full pricing" link', () => {
        render(<HomePage />);
        expect(
            screen.getByText(/See full pricing & feature comparison/),
        ).toBeInTheDocument();
    });

    it('renders "Get started" links in pricing cards', () => {
        render(<HomePage />);
        const getStartedLinks = screen.getAllByText('Get started');
        expect(getStartedLinks.length).toBe(2);
    });

    it('renders the CTA section', () => {
        render(<HomePage />);
        expect(screen.getByText('Ready to modernise your store?')).toBeInTheDocument();
        expect(
            screen.getByText(/Join hundreds of Bangladeshi retailers/),
        ).toBeInTheDocument();
    });

    it('renders CTA "Start your free trial" button', () => {
        render(<HomePage />);
        const trialLinks = screen.getAllByText('Start your free trial');
        expect(trialLinks.length).toBeGreaterThan(0);
    });

    it('renders the footer links', () => {
        render(<HomePage />);
        expect(screen.getByText('Terms of Service')).toBeInTheDocument();
        expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
        expect(screen.getByText('Refund Policy')).toBeInTheDocument();
        expect(screen.getByText('SLA')).toBeInTheDocument();
        expect(screen.getByText('Contact')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('renders the copyright notice', () => {
        render(<HomePage />);
        expect(screen.getByText(/RetailSaaS\. All rights reserved\./)).toBeInTheDocument();
    });

    it('nav Sign in link points to /login', () => {
        render(<HomePage />);
        const signInLinks = screen.getAllByRole('link', { name: /sign in/i });
        expect(signInLinks.length).toBeGreaterThan(0);
        expect(signInLinks[0]).toHaveAttribute('href', '/login');
    });

    it('nav Start free trial link points to /signup', () => {
        render(<HomePage />);
        const signupLinks = screen.getAllByRole('link', { name: /start free trial/i });
        expect(signupLinks.length).toBeGreaterThan(0);
        expect(signupLinks[0]).toHaveAttribute('href', '/signup');
    });
});
