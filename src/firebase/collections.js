import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  getDocs,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { db } from './config';

const COLLECTION = 'collections';

export const addCollection = async (data) => {
  return await addDoc(collection(db, COLLECTION), {
    ...data,
    createdAt: serverTimestamp(),
  });
};

export const addOrUpdateCollection = async (data) => {
  const q = query(
    collection(db, COLLECTION),
    where('customerId', '==', data.customerId),
    where('month', '==', data.month),
    where('year', '==', data.year)
  );
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    const existingDoc = snapshot.docs[0];
    await updateDoc(doc(db, COLLECTION, existingDoc.id), {
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      paidDate: data.paidDate,
      updatedAt: serverTimestamp(),
    });
    return existingDoc.id;
  } else {
    const newDoc = await addDoc(collection(db, COLLECTION), {
      ...data,
      createdAt: serverTimestamp(),
    });
    return newDoc.id;
  }
};

export const subscribeToCollectionsByMonth = (month, year, callback) => {
  const q = query(
    collection(db, COLLECTION),
    where('month', '==', month),
    where('year', '==', year)
  );
  return onSnapshot(q, (snapshot) => {
    const records = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    records.sort((a, b) => b.paidDate.localeCompare(a.paidDate));
    callback(records);
  }, (error) => {
    console.log('Subscription error:', error);
  });
};

export const getFilteredCollections = async (filters) => {
  const conditions = [];
  if (filters.paymentMethod && filters.paymentMethod !== 'All') {
    conditions.push(where('paymentMethod', '==', filters.paymentMethod));
  }

  const q = query(collection(db, COLLECTION), ...conditions);
  const snapshot = await getDocs(q);
  const records = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  return records.sort((a, b) => b.paidDate.localeCompare(a.paidDate));
};

