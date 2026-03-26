import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

export const exportPDF = async (collections, customers, monthName, year) => {
  try {
    const totalAmount = collections.reduce((s, c) => s + (c.amount || 0), 0);
    const paidIds = new Set(collections.map((c) => c.customerId));
    const unpaidCount = customers.length - paidIds.size;

    const rows = collections.map((c, i) => `
      <tr style="background:${i % 2 === 0 ? '#f9f9f9' : '#fff'}">
        <td>${i + 1}</td>
        <td>${c.customerName}</td>
        <td>${c.customerUniqueId}</td>
        <td>${c.customerStreet}</td>
        <td style="text-align:right;font-weight:bold;color:#2E7D32">₹${c.amount}</td>
        <td style="text-align:center"><span style="background:${c.paymentMethod === 'UPI' ? '#E3F2FD' : '#F9FBE7'};padding:2px 8px;border-radius:4px">${c.paymentMethod}</span></td>
        <td style="text-align:center">${c.paidDate}</td>
      </tr>`).join('');

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8"/>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #263238; }
        h1 { color: #1565C0; text-align: center; margin-bottom: 4px; }
        .subtitle { text-align: center; color: #607D8B; font-size: 14px; margin-bottom: 20px; }
        .summary { display: flex; gap: 16px; margin-bottom: 20px; }
        .sum-card { flex: 1; border-radius: 8px; padding: 12px; text-align: center; }
        .sum-label { font-size: 12px; color: #607D8B; }
        .sum-val { font-size: 20px; font-weight: bold; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th { background: #1565C0; color: #fff; padding: 10px 8px; text-align: left; }
        td { padding: 8px; border-bottom: 1px solid #ECEFF1; }
        .footer { margin-top: 20px; text-align: right; font-size: 12px; color: #90A4AE; }
      </style>
    </head>
    <body>
      <h1>📡 Cable Collection Report</h1>
      <p class="subtitle">${monthName} ${year}</p>
      <div class="summary">
        <div class="sum-card" style="background:#E8F5E9">
          <div class="sum-label">Total Collected</div>
          <div class="sum-val" style="color:#2E7D32">₹${totalAmount}</div>
        </div>
        <div class="sum-card" style="background:#E3F2FD">
          <div class="sum-label">Paid Customers</div>
          <div class="sum-val" style="color:#1565C0">${collections.length}</div>
        </div>
        <div class="sum-card" style="background:#FFEBEE">
          <div class="sum-label">Unpaid Customers</div>
          <div class="sum-val" style="color:#C62828">${unpaidCount}</div>
        </div>
        <div class="sum-card" style="background:#F3E5F5">
          <div class="sum-label">Total Customers</div>
          <div class="sum-val" style="color:#6A1B9A">${customers.length}</div>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>#</th><th>Name</th><th>ID</th><th>Street</th><th>Amount</th><th>Method</th><th>Date</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="footer">Generated on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
    </body>
    </html>`;

    const { uri } = await Print.printToFileAsync({ html, base64: false });
    const fileName = `CableCollection_${monthName}_${year}.pdf`;
    const newUri = uri.replace(/[^/]+$/, fileName);

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `Share ${fileName}`, UTI: 'com.adobe.pdf' });
    } else {
      Alert.alert('Saved', `PDF saved to: ${uri}`);
    }
  } catch (err) {
    Alert.alert('Export Error', err.message);
  }
};
