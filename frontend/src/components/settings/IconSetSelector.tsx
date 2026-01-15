/**
 * Icon Set Selector Component
 * 
 * Visual selector for choosing between different icon sets.
 * Shows preview icons for each set so users can see the differences.
 */

import React from 'react';
import { IconSetType, iconSetInfo, getIcon } from '../../config/iconSets';
import './IconSetSelector.css';

interface IconSetSelectorProps {
    selectedIconSet: IconSetType;
    onSelect: (iconSet: IconSetType) => void;
}

const previewIconKeys = ['dashboard', 'users', 'settings', 'bell'] as const;

const IconSetSelector: React.FC<IconSetSelectorProps> = ({ selectedIconSet, onSelect }) => {
    const iconSets = Object.values(iconSetInfo);

    return (
        <div className="icon-set-selector">
            <h3 className="icon-set-selector-title">Choose Icon Set</h3>
            <p className="icon-set-selector-description">
                Select from different icon libraries to change how icons look throughout the application.
            </p>

            <div className="icon-set-grid">
                {iconSets.map((setInfo) => {
                    const isSelected = selectedIconSet === setInfo.id;

                    return (
                        <div
                            key={setInfo.id}
                            className={`icon-set-card ${isSelected ? 'selected' : ''}`}
                            onClick={() => onSelect(setInfo.id)}
                        >
                            {isSelected && (
                                <div className="icon-set-check">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                </div>
                            )}

                            <div className="icon-set-preview">
                                {previewIconKeys.map((iconKey) => {
                                    const IconComponent = getIcon(iconKey, setInfo.id);
                                    return (
                                        <div key={iconKey} className="icon-preview-item">
                                            <IconComponent size={24} className="preview-icon" />
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="icon-set-info">
                                <h4 className="icon-set-name">{setInfo.name}</h4>
                                <p className="icon-set-desc">{setInfo.description}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default IconSetSelector;
