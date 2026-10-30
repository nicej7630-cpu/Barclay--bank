function receiptEscape(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function downloadReceipt(r) {
  if (!r || !r.rows) {
    alert('No receipt is available yet.');
    return;
  }

  const ref = receiptEscape(r.ref || 'receipt');
  const rowsHtml = r.rows
    .map(x => '<tr><td>' + receiptEscape(x[0]) + '</td><td>' + receiptEscape(x[1]) + '</td></tr>')
    .join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Itrace Bank Receipt ${ref}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #111; max-width: 480px; margin: 40px auto; padding: 0 20px; }
    h1 { font-size: 22px; margin-bottom: 4px; }
    .muted { color: #666; font-size: 13px; }
    .ok { margin-top: 16px; color: #0a7a3d; font-weight: bold; }
    .amount { font-size: 22px; font-weight: bold; margin-top: 16px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    td { padding: 10px 0; border-bottom: 1px solid #ddd; vertical-align: top; }
    td:first-child { color: #666; width: 40%; }
    footer { margin-top: 32px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <h1>Itrace Bank Financial</h1>
  <div class="muted">Payment Receipt · itracebank.org</div>
  <div class="ok">✓ ${receiptEscape(r.title || '')}</div>
  <div class="amount">${receiptEscape(r.amount || '')}</div>
  <table>${rowsHtml}</table>
  <footer>Itrace Bank Financial · 27 Gresham Street, London, EC2V 7HN, United Kingdom</footer>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'itrace-receipt-' + (r.ref || 'receipt') + '.html';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
