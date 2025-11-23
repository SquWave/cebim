import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, doc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

export const useFirestore = (collectionName) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        if (!user) {
            setData([]);
            setLoading(false);
            return;
        }

        // Reference to the user's specific subcollection
        // Path: users/{userId}/{collectionName}
        const collectionRef = collection(db, 'users', user.id, collectionName);

        const unsubscribe = onSnapshot(collectionRef, (snapshot) => {
            const items = snapshot.docs.map(doc => ({
                id: doc.id, // Use Firestore doc ID
                ...doc.data()
            }));
            setData(items);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching data:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, collectionName]);

    const add = async (item) => {
        if (!user) return;
        // Use item.id as doc ID if present (for consistency), otherwise auto-ID
        const docId = item.id ? String(item.id) : String(Date.now());
        const docRef = doc(db, 'users', user.id, collectionName, docId);
        await setDoc(docRef, item);
    };

    const update = async (item) => {
        if (!user) return;
        const docRef = doc(db, 'users', user.id, collectionName, String(item.id));
        await setDoc(docRef, item, { merge: true });
    };

    const remove = async (id) => {
        if (!user) return;
        const docRef = doc(db, 'users', user.id, collectionName, String(id));
        await deleteDoc(docRef);
    };

    return { data, add, update, remove, loading };
};
