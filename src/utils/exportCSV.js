import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

export const exportCSV = async (collections, monthName, year) => {
  try {
    const header = 'Customer Name,Unique ID,Street,Amount (Rs),Payment Method,Date Paid\n';
    const rows = collections.map((c) =>
      `"${c.customerName}","${c.customerUniqueId}","${c.customerStreet}",${c.amount},${c.paymentMethod},${c.paidDate}`
    ).join('\n');

    const content = header + rows;
    const fileName = `CableCollection_${monthName}_${year}.csv`;
    const fileUri = FileSystem.cacheDirectory + fileName;

    await FileSystem.writeAsStringAsync(fileUri, content);

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: `Share Cable Collection CSV - ${monthName} ${year}`,
        UTI: 'public.comma-separated-values-text',
      });
    } else {
      Alert.alert('Saved', `CSV saved to: ${fileUri}`);
    }
  } catch (err) {
    console.error('CSV Export Error:', err);
    Alert.alert('Export Error', err.message);
  }
};
