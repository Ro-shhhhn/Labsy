import html2pdf from "html2pdf.js";

function generateInvoiceHTML(invoice, items, labName, payments = []) {
  const date = new Date(invoice.created_at).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const invoiceId = invoice.id.slice(0, 8).toUpperCase();
  const pm = invoice.payment_method
    ? invoice.payment_method.toUpperCase()
    : "—";

  const subtotal = items.reduce((s, i) => s + Number(i.price), 0);
  const total = Number(invoice.total);
  const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0);
  const balance = total - totalPaid;

  const statusText =
    balance <= 0 ? "PAID" : totalPaid > 0 ? "PARTIAL" : "UNPAID";
  const statusColor =
    balance <= 0 ? "#059669" : totalPaid > 0 ? "#d97706" : "#dc2626";

  const itemRows = items
    .map(
      (item, i) => `
      <tr>
        <td style="padding:8px 12px; border-bottom:1px solid #e5e7eb; font-size:12px; color:#6b7280; text-align:center;">${i + 1}</td>
        <td style="padding:8px 12px; border-bottom:1px solid #e5e7eb; font-size:12px; color:#1f2937;">${item.tests?.name || "Unknown"}</td>
        <td style="padding:8px 12px; border-bottom:1px solid #e5e7eb; font-size:12px; color:#1f2937; text-align:right; font-family:'Courier New',monospace; font-weight:600;">₹${Number(item.price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
      </tr>`
    )
    .join("");

  const paymentRows = payments.length
    ? `
    <div style="margin-top:20px;">
      <div style="font-size:10px; text-transform:uppercase; letter-spacing:0.08em; color:#6b7280; font-weight:700; margin-bottom:6px;">Payment History</div>
      <table style="width:100%; border-collapse:collapse; border:1px solid #e5e7eb;">
        <thead>
          <tr style="background:#f9fafb;">
            <th style="padding:6px 10px; font-size:10px; text-transform:uppercase; color:#6b7280; font-weight:600; text-align:left; border-bottom:1px solid #e5e7eb;">Date</th>
            <th style="padding:6px 10px; font-size:10px; text-transform:uppercase; color:#6b7280; font-weight:600; text-align:left; border-bottom:1px solid #e5e7eb;">Method</th>
            <th style="padding:6px 10px; font-size:10px; text-transform:uppercase; color:#6b7280; font-weight:600; text-align:right; border-bottom:1px solid #e5e7eb;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${payments
            .map(
              (p) => `
            <tr>
              <td style="padding:6px 10px; font-size:11px; color:#374151; border-bottom:1px solid #f3f4f6;">${new Date(p.payment_date).toLocaleDateString("en-IN")}</td>
              <td style="padding:6px 10px; font-size:11px; color:#374151; border-bottom:1px solid #f3f4f6; text-transform:uppercase;">${p.payment_method}</td>
              <td style="padding:6px 10px; font-size:11px; color:#374151; border-bottom:1px solid #f3f4f6; text-align:right; font-family:'Courier New',monospace;">₹${Number(p.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>`
    : "";

  // Return just the invoice content (no full HTML document needed for PDF)
  return `
    <div class="invoice-box" style="max-width:680px; margin:0 auto; padding:32px; font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; background:#fff; color:#1f2937;">
      <table style="width:100%; margin-bottom:20px;">
        <tr>
          <td style="vertical-align:top;">
            <div style="font-size:20px; font-weight:800; color:#1f2937;">${labName}</div>
            <div style="font-size:10px; color:#9ca3af; margin-top:2px; text-transform:uppercase; letter-spacing:0.05em;">Laboratory Services</div>
          </td>
          <td style="vertical-align:top; text-align:right;">
            <div style="font-size:24px; font-weight:800; color:#374151;">INVOICE</div>
          </td>
        </tr>
      </table>

      <div style="height:2px; background:#1f2937; margin-bottom:18px;"></div>

      <table style="width:100%; margin-bottom:20px;">
        <tr>
          <td style="vertical-align:top; width:50%;">
            <div style="font-size:9px; text-transform:uppercase; letter-spacing:0.08em; color:#9ca3af; font-weight:700; margin-bottom:4px;">Bill To</div>
            <div style="font-size:14px; font-weight:700; color:#1f2937;">${invoice.patients?.name || "Unknown"}</div>
            <div style="font-size:12px; color:#6b7280; margin-top:1px;">Phone: ${invoice.patients?.phone || "—"}</div>
          </td>
          <td style="vertical-align:top; width:50%; text-align:right;">
            <table style="margin-left:auto;">
              <tr><td style="padding:2px 10px 2px 0; font-size:11px; color:#9ca3af; text-align:right;">Invoice No.</td><td style="padding:2px 0; font-size:11px; color:#1f2937; font-weight:700; font-family:'Courier New',monospace;">#${invoiceId}</td></tr>
              <tr><td style="padding:2px 10px 2px 0; font-size:11px; color:#9ca3af; text-align:right;">Date</td><td style="padding:2px 0; font-size:11px; color:#1f2937; font-weight:600;">${date}</td></tr>
              <tr><td style="padding:2px 10px 2px 0; font-size:11px; color:#9ca3af; text-align:right;">Payment</td><td style="padding:2px 0; font-size:11px; color:#1f2937; font-weight:600;">${pm}</td></tr>
              <tr><td style="padding:2px 10px 2px 0; font-size:11px; color:#9ca3af; text-align:right;">Status</td><td style="padding:2px 0; font-size:11px; font-weight:700; color:${statusColor};">${statusText}</td></tr>
            </table>
          </td>
        </tr>
      </table>

      <table style="width:100%; border-collapse:collapse; border:1px solid #e5e7eb;">
        <thead>
          <tr style="background:#f9fafb;">
            <th style="padding:8px 12px; font-size:10px; text-transform:uppercase; color:#6b7280; font-weight:700; text-align:center; border-bottom:2px solid #e5e7eb; width:40px;">Sl.</th>
            <th style="padding:8px 12px; font-size:10px; text-transform:uppercase; color:#6b7280; font-weight:700; text-align:left; border-bottom:2px solid #e5e7eb;">Description</th>
            <th style="padding:8px 12px; font-size:10px; text-transform:uppercase; color:#6b7280; font-weight:700; text-align:right; border-bottom:2px solid #e5e7eb; width:120px;">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>

      <table style="width:100%; border-collapse:collapse; border:1px solid #e5e7eb; border-top:none;">
        <tr><td style="padding:8px 12px; text-align:right; font-size:12px; color:#6b7280;">Subtotal</td><td style="padding:8px 12px; text-align:right; font-size:12px; color:#1f2937; font-family:'Courier New',monospace; font-weight:600; width:120px;">₹${subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td></tr>
        <tr style="background:#f9fafb;"><td style="padding:10px 12px; text-align:right; font-size:14px; font-weight:800; color:#1f2937;">TOTAL</td><td style="padding:10px 12px; text-align:right; font-size:14px; font-weight:800; color:#1f2937; font-family:'Courier New',monospace; width:120px;">₹${total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td></tr>
      </table>

      <table style="width:100%; margin-top:16px; border-collapse:collapse;">
        <tr><td style="padding:4px 0; font-size:11px; color:#6b7280;">Total Amount</td><td style="padding:4px 0; font-size:11px; color:#1f2937; font-weight:600; text-align:right; font-family:'Courier New',monospace;">₹${total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td></tr>
        <tr><td style="padding:4px 0; font-size:11px; color:#6b7280;">Amount Paid</td><td style="padding:4px 0; font-size:11px; color:#059669; font-weight:600; text-align:right; font-family:'Courier New',monospace;">₹${totalPaid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td></tr>
        <tr style="border-top:2px solid #1f2937;"><td style="padding:8px 0; font-size:13px; font-weight:800; color:#1f2937;">Balance Due</td><td style="padding:8px 0; font-size:13px; font-weight:800; color:${balance > 0 ? "#dc2626" : "#059669"}; text-align:right; font-family:'Courier New',monospace;">₹${balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td></tr>
      </table>

      ${paymentRows}

      <div style="margin-top:32px; padding-top:12px; border-top:1px solid #e5e7eb; text-align:center;">
        <div style="font-size:11px; color:#6b7280;">Thank you for choosing <strong>${labName}</strong></div>
        <div style="font-size:9px; color:#9ca3af; margin-top:3px;">Computer-generated invoice. No signature required.</div>
      </div>
    </div>
  `;
}

// Full HTML for print window (separate from PDF)
function generatePrintHTML(invoice, items, labName, payments = []) {
  const content = generateInvoiceHTML(invoice, items, labName, payments);
  const invoiceId = invoice.id.slice(0, 8).toUpperCase();
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice #${invoiceId}</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; background:#fff; color:#1f2937; }
        @media print { body{padding:0;} .invoice-box{padding:16px;} .no-print{display:none!important;} @page{margin:10mm;} }
      </style>
    </head>
    <body>
      ${content}
      <div class="no-print" style="display:flex; gap:10px; justify-content:center; margin-top:24px; padding-bottom:24px;">
        <button onclick="window.print()" style="padding:8px 24px; background:#1f2937; color:#fff; border:none; border-radius:8px; font-size:12px; font-weight:700; cursor:pointer;">Print</button>
        <button onclick="window.close()" style="padding:8px 24px; background:#f3f4f6; color:#374151; border:1px solid #d1d5db; border-radius:8px; font-size:12px; font-weight:700; cursor:pointer;">Close</button>
      </div>
    </body>
    </html>
  `;
}

export function printInvoice(invoice, items, labName, payments = []) {
  const html = generatePrintHTML(invoice, items, labName, payments);
  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
  setTimeout(() => {
    win.focus();
    win.print();
  }, 300);
}

export async function downloadInvoicePDF(invoice, items, labName, payments = []) {
  const html = generateInvoiceHTML(invoice, items, labName, payments);

  // Create a completely isolated container using an iframe
  const iframe = document.createElement("iframe");
  iframe.style.cssText = `
    position: absolute;
    width: 0;
    height: 0;
    border: 0;
    visibility: hidden;
    pointer-events: none;
  `;
  document.body.appendChild(iframe);

  // Write content to iframe
  const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #fff; }
      </style>
    </head>
    <body>${html}</body>
    </html>
  `);
  iframeDoc.close();

  // Wait for iframe to render
  await new Promise((resolve) => setTimeout(resolve, 100));

  const element = iframeDoc.querySelector(".invoice-box");

  try {
    await html2pdf()
      .set({
        margin: [8, 8, 8, 8],
        filename: `Invoice_${invoice.id.slice(0, 8).toUpperCase()}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          logging: false,
          windowWidth: 800, // Fixed width for consistent rendering
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(element)
      .save();
  } finally {
    // Clean up iframe
    document.body.removeChild(iframe);
  }
}