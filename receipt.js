let lastTransfer = null;

function receiptEscape(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function downloadReceipt(txn) {
  if (!txn) {
    alert('No transfer found to create a receipt.');
    return;
  }

  const ref = receiptEscape(txn.id || txn.reference || 'ITR-' + Date.now().toString(36).toUpperCase());
  const date = receiptEscape(new Date(txn.date || Date.now()).toLocaleString('en-GB'));
  const amount = receiptEscape(
    Number(txn.amount || 0).toLocaleString('en-GB', {
      style: 'currency',
      currency: txn.currency || 'GBP'
    })
  );

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
    table { width: 100%; border-collapse: collapse; margin-top: 24px; }
    td { padding: 10px 0; border-bottom: 1px solid #ddd; vertical-align: top; }
    td:first-child { color: #666; width: 40%; }
    .amount { font-size: 20px; font-weight: bold; }
    footer { margin-top: 32px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <h1>Payment Receipt</h1>
  <div class="muted">Itrace Bank · itracebank.org</div>
  <table>
    <tr><td>Reference</td><td>${ref}</td></tr>
    <tr><td>Date</td><td>${date}</td></tr>
    <tr><td>From</td><td>${receiptEscape(txn.fromName || txn.sender || '')}</td></tr>
    <tr><td>To</td><td>${receiptEscape(txn.toName || txn.recipient || '')}</td></tr>
    <tr><td>Description</td><td>${receiptEscape(txn.description || txn.note || '')}</td></tr>
    <tr><td>Amount</td><td class="amount">${amount}</td></tr>
    <tr><td>Status</td><td>${receiptEscape(txn.status || 'Completed')}</td></tr>
  </table>
  <footer>Keep this receipt for your records. For help, contact Itrace Bank support.</footer>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `itrace-receipt-${ref}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
