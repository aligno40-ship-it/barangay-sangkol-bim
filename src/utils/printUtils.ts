/**
 * Utility functions for reliable printing, PDF document generation,
 * and CSV data export in Barangay Sangkol Management System (BS-MIS).
 */

/**
 * Robust print helper that creates an isolated hidden iframe
 * to trigger clean, unclipped print dialogs across all browsers and iframe contexts.
 */
export function printHtmlDocument(title: string, bodyHtml: string): void {
  // Try using an isolated print iframe first for iframe-safe printing
  try {
    const existingFrame = document.getElementById('bims-print-frame');
    if (existingFrame) {
      existingFrame.remove();
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'bims-print-frame';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) {
      window.print();
      return;
    }

    const fullHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 12mm 15mm 15mm 15mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
            margin: 0;
            padding: 0;
            font-size: 11pt;
            line-height: 1.4;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            margin-bottom: 15px;
            font-size: 10pt;
          }
          th, td {
            border: 1px solid #cbd5e1;
            padding: 6px 8px;
            text-align: left;
          }
          th {
            background-color: #f1f5f9 !important;
            font-weight: 700;
            color: #1e293b;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .font-bold { font-weight: 700; }
          .font-black { font-weight: 900; }
          .uppercase { text-transform: uppercase; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
          .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
          .grid-4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px; }
          .kpi-card {
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 10px 12px;
            background-color: #f8fafc !important;
          }
          .kpi-title {
            font-size: 8pt;
            text-transform: uppercase;
            font-weight: 700;
            color: #64748b;
          }
          .kpi-value {
            font-size: 18pt;
            font-weight: 900;
            color: #0f172a;
            margin-top: 2px;
          }
          .page-break {
            page-break-after: always;
            break-after: page;
          }
          .avoid-break {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .signature-box {
            margin-top: 30px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            font-size: 9pt;
          }
          .sig-line {
            margin-top: 40px;
            border-top: 1px solid #0f172a;
            padding-top: 4px;
            font-weight: 700;
            text-transform: uppercase;
          }
        </style>
      </head>
      <body>
        ${bodyHtml}
      </body>
      </html>
    `;

    doc.open();
    doc.write(fullHtml);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.warn('Iframe print failed, falling back to window.print()', err);
        window.print();
      }
    }, 400);
  } catch (e) {
    console.error('Print utility error:', e);
    window.print();
  }
}

/**
 * Robust, dedicated certificate printing utility.
 * Renders ONLY the certificate inside an isolated document containing all styles,
 * preventing any dashboard tables, headers, footers, or dark-mode backgrounds from leaking into the print job.
 */
export function printCertificateElement(elementId: string, title: string = 'Official Barangay Certificate'): boolean {
  const sourceEl = document.getElementById(elementId);
  if (!sourceEl) {
    window.print();
    return false;
  }

  try {
    const existingFrame = document.getElementById('bims-cert-print-frame');
    if (existingFrame) {
      existingFrame.remove();
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'bims-cert-print-frame';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) {
      window.print();
      return false;
    }

    // Capture all stylesheet tags and embedded style rules from main document
    const styleTags = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map(node => node.outerHTML)
      .join('\n');

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  ${styleTags}
  <style>
    @page {
      size: auto;
      margin: 8mm 10mm;
    }
    html, body {
      background-color: #ffffff !important;
      background: #ffffff !important;
      color: #000000 !important;
      margin: 0 !important;
      padding: 0 !important;
      height: auto !important;
      min-height: 100% !important;
      font-size: 11pt !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .printable-area, #printable-certificate {
      box-shadow: none !important;
      margin: 0 auto !important;
      max-width: 8.5in !important;
      width: 100% !important;
      border: 6px double #92400e !important;
      background: #ffffff !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    .no-print {
      display: none !important;
    }
  </style>
</head>
<body class="bg-white text-slate-900 font-serif">
  <div style="display: flex; justify-content: center; width: 100%; margin: 0; padding: 0;">
    ${sourceEl.outerHTML}
  </div>
</body>
</html>`;

    doc.open();
    doc.write(htmlContent);
    doc.close();

    // Give browser brief tick to parse styles, seals and fonts in iframe
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.warn('Iframe print failed, falling back to window.print()', err);
        window.print();
      }
    }, 250);

    return true;
  } catch (err) {
    console.error('Failed to trigger isolated certificate print:', err);
    window.print();
    return false;
  }
}

/**
 * Triggers a file download in the browser
 */
export function downloadFile(filename: string, content: string, contentType: string): void {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Downloads a standalone printable HTML report with complete embedded styles
 */
export function downloadHtmlReport(filename: string, title: string, bodyHtml: string): void {
  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 24px;
      max-width: 850px;
      margin: 0 auto;
      font-size: 11pt;
      line-height: 1.4;
    }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 15px; font-size: 10pt; }
    th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
    th { background-color: #f1f5f9; font-weight: 700; color: #1e293b; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-bold { font-weight: 700; }
    .font-black { font-weight: 900; }
    .uppercase { text-transform: uppercase; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
    .grid-4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px; }
    .kpi-card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 12px; background-color: #f8fafc; }
    .kpi-title { font-size: 8pt; text-transform: uppercase; font-weight: 700; color: #64748b; }
    .kpi-value { font-size: 18pt; font-weight: 900; color: #0f172a; margin-top: 2px; }
    .page-break { page-break-after: always; break-after: page; }
    .avoid-break { page-break-inside: avoid; break-inside: avoid; }
    .signature-box { margin-top: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 30px; font-size: 9pt; }
    .sig-line { margin-top: 40px; border-top: 1px solid #0f172a; padding-top: 4px; font-weight: 700; text-transform: uppercase; }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 20px; text-align: right;">
    <button onclick="window.print()" style="background:#4f46e5; color:#fff; border:none; padding:8px 16px; border-radius:6px; font-weight:bold; cursor:pointer;">Print Document</button>
  </div>
  ${bodyHtml}
</body>
</html>`;

  downloadFile(filename, fullHtml, 'text/html;charset=utf-8;');
}

/**
 * Exports data rows to CSV spreadsheet format
 */
export function exportToCsv(filename: string, headers: string[], rows: (string | number | boolean | null | undefined)[][]): void {
  const formatCell = (val: string | number | boolean | null | undefined): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvRows: string[] = [];
  csvRows.push(headers.map(formatCell).join(','));

  rows.forEach((row) => {
    csvRows.push(row.map(formatCell).join(','));
  });

  const csvContent = '\uFEFF' + csvRows.join('\r\n');
  downloadFile(filename, csvContent, 'text/csv;charset=utf-8;');
}
