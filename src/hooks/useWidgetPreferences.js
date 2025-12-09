import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

/**
 * Hook for managing user's widget preferences in Firebase
 * Stores which widgets are enabled on the Dashboard
 */
export const useWidgetPreferences = () => {
    const [enabledWidgets, setEnabledWidgets] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    // Listen to widget preferences from Firebase
    useEffect(() => {
        if (!user) {
            setEnabledWidgets([]);
            setLoading(false);
            return;
        }

        // Path: users/{userId}/preferences/widgets
        const docRef = doc(db, 'users', user.id, 'preferences', 'widgets');

        const unsubscribe = onSnapshot(docRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                setEnabledWidgets(data.enabledWidgets || []);
            } else {
                // Default: no widgets enabled (user adds what they want)
                setEnabledWidgets([]);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching widget preferences:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    // Toggle a widget on/off
    const toggleWidget = async (widgetId) => {
        if (!user) return;

        const newEnabledWidgets = enabledWidgets.includes(widgetId)
            ? enabledWidgets.filter(id => id !== widgetId)
            : [...enabledWidgets, widgetId];

        // Optimistic update
        setEnabledWidgets(newEnabledWidgets);

        // Save to Firebase
        const docRef = doc(db, 'users', user.id, 'preferences', 'widgets');
        await setDoc(docRef, { enabledWidgets: newEnabledWidgets }, { merge: true });
    };

    // Set all enabled widgets at once (for reordering later)
    const setWidgets = async (widgetIds) => {
        if (!user) return;

        setEnabledWidgets(widgetIds);

        const docRef = doc(db, 'users', user.id, 'preferences', 'widgets');
        await setDoc(docRef, { enabledWidgets: widgetIds }, { merge: true });
    };

    // Check if a specific widget is enabled
    const isWidgetEnabled = (widgetId) => enabledWidgets.includes(widgetId);

    return {
        enabledWidgets,
        loading,
        toggleWidget,
        setWidgets,
        isWidgetEnabled
    };
};
