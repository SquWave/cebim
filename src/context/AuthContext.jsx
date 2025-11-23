import React, { createContext, useState, useContext, useEffect } from 'react';
import CryptoJS from 'crypto-js';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for existing session
        const storedUser = localStorage.getItem('cebim_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (secretKey) => {
        try {
            let hashHex;

            // Check if native Web Crypto API is available (requires HTTPS or localhost)
            if (window.crypto && window.crypto.subtle) {
                const msgBuffer = new TextEncoder().encode(secretKey);
                const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            } else {
                // Fallback for insecure contexts (e.g., local network testing on mobile)
                console.warn("Secure context not found. Using CryptoJS fallback.");
                hashHex = CryptoJS.SHA256(secretKey).toString();
            }

            const userData = {
                id: hashHex,
                key: secretKey
            };

            setUser(userData);
            localStorage.setItem('cebim_user', JSON.stringify(userData));
            return userData;
        } catch (error) {
            console.error("Login error:", error);
            alert("Giriş sırasında bir hata oluştu: " + error.message);
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('cebim_user');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
