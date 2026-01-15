/**
 * Icon Set Context
 * 
 * Provides global state management for the selected icon set.
 * Components can use useIconSet() to get the current icon set and icons.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { IconSetType, IconKey, getIcon, getCurrentIconSet, setCurrentIconSet, iconSetInfo } from '../config/iconSets';

interface IconSetContextType {
    iconSet: IconSetType;
    setIconSet: (iconSet: IconSetType) => void;
    getIconComponent: (key: IconKey) => React.ComponentType<{ size?: number; className?: string }>;
    iconSetName: string;
}

const IconSetContext = createContext<IconSetContextType | undefined>(undefined);

export const IconSetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [iconSet, setIconSetState] = useState<IconSetType>('lucide');

    // Load icon set from localStorage on mount
    useEffect(() => {
        const stored = getCurrentIconSet();
        setIconSetState(stored);
    }, []);

    // Listen for iconSetChanged events (from other tabs/components)
    useEffect(() => {
        const handleIconSetChange = (event: CustomEvent<{ iconSet: IconSetType }>) => {
            setIconSetState(event.detail.iconSet);
        };

        window.addEventListener('iconSetChanged', handleIconSetChange as EventListener);
        return () => {
            window.removeEventListener('iconSetChanged', handleIconSetChange as EventListener);
        };
    }, []);

    const setIconSet = useCallback((newIconSet: IconSetType) => {
        setIconSetState(newIconSet);
        setCurrentIconSet(newIconSet);
    }, []);

    const getIconComponent = useCallback((key: IconKey) => {
        return getIcon(key, iconSet);
    }, [iconSet]);

    const iconSetName = iconSetInfo[iconSet]?.name || 'Modern Line';

    return (
        <IconSetContext.Provider value={{ iconSet, setIconSet, getIconComponent, iconSetName }}>
            {children}
        </IconSetContext.Provider>
    );
};

export const useIconSet = (): IconSetContextType => {
    const context = useContext(IconSetContext);
    if (!context) {
        throw new Error('useIconSet must be used within an IconSetProvider');
    }
    return context;
};

export default IconSetContext;
