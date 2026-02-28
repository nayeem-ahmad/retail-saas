import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Retail SaaS - Fresh Start",
    description: "Enterprise-grade Retail SaaS Platform",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
