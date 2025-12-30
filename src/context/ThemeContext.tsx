import React, { createContext, useState, useContext, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';

const ThemeContext = createContext({
    theme: {
        primary: '#4f46e5',
        secondary: '#10b981',
        accent: '#f59e0b',
        background: '#ffffff',
        text: '#1f2937'
    },
    tenant: null,
    loading: true,
    setSchoolCode: (code: string) => { },
});

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState({
        primary: '#4f46e5',
        secondary: '#10b981',
        accent: '#f59e0b',
        background: '#ffffff',
        text: '#1f2937'
    });
    const [tenant, setTenant] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchTheme = async (schoolCode) => {
        setLoading(true);
        try {
            // In a real app, use the backend URL
            const API_URL = 'http://10.0.2.2:8000/api/mobile/config/' + schoolCode;
            const response = await fetch(API_URL);
            if (response.ok) {
                const data = await response.json();
                setTenant(data);
                if (data.colors) {
                    setTheme(prev => ({ ...prev, ...data.colors }));
                }
            } else {
                console.error("School not found");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ThemeContext.Provider value={{ theme, tenant, loading, setSchoolCode: fetchTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
