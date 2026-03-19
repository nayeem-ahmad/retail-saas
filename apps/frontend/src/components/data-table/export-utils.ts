import type { Table } from '@tanstack/react-table';

/* --------------------------------------------------------------- */
/*  CSV Export                                                      */
/* --------------------------------------------------------------- */
export function exportToCSV<T>(table: Table<T>, filename: string) {
    const headers = table
        .getVisibleLeafColumns()
        .filter((c) => c.id !== 'actions' && c.id !== 'select')
        .map((c) => c.columnDef.header as string);

    const rows = table.getFilteredRowModel().rows.map((row) =>
        table
            .getVisibleLeafColumns()
            .filter((c) => c.id !== 'actions' && c.id !== 'select')
            .map((col) => {
                const val = row.getValue(col.id);
                const str = val == null ? '' : String(val);
                // Escape CSV special chars
                return str.includes(',') || str.includes('"') || str.includes('\n')
                    ? `"${str.replace(/"/g, '""')}"`
                    : str;
            }),
    );

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadBlob(csv, `${filename}.csv`, 'text/csv;charset=utf-8;');
}

/* --------------------------------------------------------------- */
/*  Excel Export (xlsx)                                              */
/* --------------------------------------------------------------- */
export async function exportToExcel<T>(table: Table<T>, filename: string) {
    const XLSX = await import('xlsx');

    const headers = table
        .getVisibleLeafColumns()
        .filter((c) => c.id !== 'actions' && c.id !== 'select')
        .map((c) => c.columnDef.header as string);

    const data = table.getFilteredRowModel().rows.map((row) => {
        const obj: Record<string, unknown> = {};
        table
            .getVisibleLeafColumns()
            .filter((c) => c.id !== 'actions' && c.id !== 'select')
            .forEach((col) => {
                const header = col.columnDef.header as string;
                obj[header] = row.getValue(col.id) ?? '';
            });
        return obj;
    });

    const ws = XLSX.utils.json_to_sheet(data, { header: headers });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    XLSX.writeFile(wb, `${filename}.xlsx`);
}

/* --------------------------------------------------------------- */
/*  PDF Export (jspdf + autotable)                                  */
/* --------------------------------------------------------------- */
export async function exportToPDF<T>(table: Table<T>, filename: string) {
    const { default: jsPDF } = await import('jspdf');
    await import('jspdf-autotable');

    const headers = table
        .getVisibleLeafColumns()
        .filter((c) => c.id !== 'actions' && c.id !== 'select')
        .map((c) => c.columnDef.header as string);

    const rows = table.getFilteredRowModel().rows.map((row) =>
        table
            .getVisibleLeafColumns()
            .filter((c) => c.id !== 'actions' && c.id !== 'select')
            .map((col) => {
                const val = row.getValue(col.id);
                return val == null ? '' : String(val);
            }),
    );

    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(16);
    doc.text(filename, 14, 20);

    (doc as any).autoTable({
        head: [headers],
        body: rows,
        startY: 30,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [37, 99, 235] },
    });

    doc.save(`${filename}.pdf`);
}

/* --------------------------------------------------------------- */
/*  Print                                                           */
/* --------------------------------------------------------------- */
export function printTable<T>(table: Table<T>, title: string) {
    const headers = table
        .getVisibleLeafColumns()
        .filter((c) => c.id !== 'actions' && c.id !== 'select')
        .map((c) => c.columnDef.header as string);

    const rows = table.getFilteredRowModel().rows.map((row) =>
        table
            .getVisibleLeafColumns()
            .filter((c) => c.id !== 'actions' && c.id !== 'select')
            .map((col) => {
                const val = row.getValue(col.id);
                return val == null ? '' : String(val);
            }),
    );

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 24px; color: #111; }
  h1 { font-size: 20px; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 12px; }
  th { background: #f9fafb; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; font-size: 10px; }
  tr:nth-child(even) { background: #f9fafb; }
  .footer { margin-top: 32px; text-align: center; color: #9ca3af; font-size: 11px; }
</style></head><body>
<h1>${title}</h1>
<table>
  <thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
  <tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
</table>
<div class="footer">Printed on ${new Date().toLocaleString()}</div>
</body></html>`);
    printWindow.document.close();
    printWindow.print();
}

/* --------------------------------------------------------------- */
/*  Helper                                                          */
/* --------------------------------------------------------------- */
function downloadBlob(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}
