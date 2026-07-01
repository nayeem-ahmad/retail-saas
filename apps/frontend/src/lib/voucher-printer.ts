import { formatBDT } from './format';

export interface VoucherPrintLine {
    accountName: string;
    accountCode?: string | null;
    debit: number;
    credit: number;
    comment?: string | null;
}

export interface VoucherPrintData {
    businessName?: string;
    voucherNumber: string;
    voucherType: string;
    date: string;
    referenceNumber?: string | null;
    description?: string | null;
    totalAmount: number;
    lines: VoucherPrintLine[];
    labels: {
        title: string;
        voucherNumber: string;
        date: string;
        type: string;
        reference: string;
        narration: string;
        account: string;
        debit: string;
        credit: string;
        total: string;
        footer: string;
    };
}

function escHtml(value: string) {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;');
}

export function printVoucher(data: VoucherPrintData): void {
    const linesHtml = data.lines.map((line) => `
        <tr>
            <td>${escHtml(line.accountName)}${line.accountCode ? ` <span class="muted">(${escHtml(line.accountCode)})</span>` : ''}</td>
            <td class="num">${line.debit > 0 ? escHtml(formatBDT(line.debit)) : ''}</td>
            <td class="num">${line.credit > 0 ? escHtml(formatBDT(line.credit)) : ''}</td>
        </tr>
    `).join('');

    const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${escHtml(data.labels.title)} ${escHtml(data.voucherNumber)}</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; font-size: 12px; color: #111; padding: 24px; }
        .business { text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 4px; }
        .title { text-align: center; font-size: 14px; font-weight: bold; text-transform: uppercase; margin-bottom: 16px; }
        .meta { width: 100%; margin-bottom: 16px; }
        .meta td { padding: 3px 0; vertical-align: top; }
        .meta .label { color: #666; width: 110px; }
        table.lines { width: 100%; border-collapse: collapse; margin-top: 8px; }
        table.lines th, table.lines td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
        table.lines th { background: #f5f5f5; font-size: 11px; text-transform: uppercase; }
        .num { text-align: right; white-space: nowrap; }
        .muted { color: #666; font-size: 10px; }
        .total { margin-top: 12px; text-align: right; font-weight: bold; }
        .footer { margin-top: 24px; text-align: center; color: #666; font-size: 10px; }
    </style>
</head>
<body>
    ${data.businessName ? `<div class="business">${escHtml(data.businessName)}</div>` : ''}
    <div class="title">${escHtml(data.labels.title)}</div>
    <table class="meta">
        <tr><td class="label">${escHtml(data.labels.voucherNumber)}</td><td>${escHtml(data.voucherNumber)}</td></tr>
        <tr><td class="label">${escHtml(data.labels.date)}</td><td>${escHtml(data.date)}</td></tr>
        <tr><td class="label">${escHtml(data.labels.type)}</td><td>${escHtml(data.voucherType.replaceAll('_', ' '))}</td></tr>
        ${data.referenceNumber ? `<tr><td class="label">${escHtml(data.labels.reference)}</td><td>${escHtml(data.referenceNumber)}</td></tr>` : ''}
        ${data.description ? `<tr><td class="label">${escHtml(data.labels.narration)}</td><td>${escHtml(data.description)}</td></tr>` : ''}
    </table>
    <table class="lines">
        <thead>
            <tr>
                <th>${escHtml(data.labels.account)}</th>
                <th class="num">${escHtml(data.labels.debit)}</th>
                <th class="num">${escHtml(data.labels.credit)}</th>
            </tr>
        </thead>
        <tbody>${linesHtml}</tbody>
    </table>
    <div class="total">${escHtml(data.labels.total)}: ${escHtml(formatBDT(data.totalAmount))}</div>
    <div class="footer">${escHtml(data.labels.footer)}</div>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=800,height=900');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.onload = () => win.print();
}