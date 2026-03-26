import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';

const COLLECTION = 'customers';

export const addCustomer = async (data) => {
  return await addDoc(collection(db, COLLECTION), {
    ...data,
    createdAt: serverTimestamp(),
  });
};

export const updateCustomer = async (id, data) => {
  return await updateDoc(doc(db, COLLECTION, id), data);
};

export const deleteCustomer = async (id) => {
  return await deleteDoc(doc(db, COLLECTION, id));
};

export const subscribeToCustomers = (callback) => {
  const q = query(collection(db, COLLECTION), orderBy('name', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const customers = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(customers);
  });
};
