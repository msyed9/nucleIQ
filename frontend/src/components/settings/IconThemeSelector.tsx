/**
 * Icon Theme Selector Component
 * 
 * A beautiful visual selector for choosing between different UI/icon themes.
 * Displays all available themes as interactive cards with previews.
 */

import React from 'react';
import { Check, Palette, Sparkles, Sun, Moon, Zap, Shield } from 'lucide-react';
import { iconThemes, IconTheme } from '../../config/iconThemes';
import './IconThemeSelector.css';

interface IconThemeSelectorProps {
    selectedTheme: string;
    onSelect: (themeId: string) => void;
}

const themeIcons: Record<string, React.ReactNode> = {
    modern_gradient: <Sparkles size={24} />,
    minimal_outline: <Sun size={24} />,
    duotone: <Palette size={24} />,
    retro_flat: <Zap size={24} />,
    neon_glow: <Moon size={24} />,
    classic_solid: <Shield size={24} />
};

const IconThemeSelector: React.FC<IconThemeSelectorProps> = ({ selectedTheme, onSelect }) => {
    const themes = Object.values(iconThemes);

    return (
        <div className="icon-theme-selector">
            <div className="icon-theme-header">
                <div className="icon-theme-title">
                    <Palette size={20} />
                    <span>Icon & UI Theme</span>
                </div>
                <p className="icon-theme-description">
                    Choose a visual style that reflects your school's identity. This will be applied to all users in your tenant.
                </p>
            </div>

            <div className="icon-theme-grid">
                {themes.map((theme: IconTheme) => {
                    const isSelected = selectedTheme === theme.id;

                    return (
                        <div
                            key={theme.id}
                            className={`icon-theme-card ${isSelected ? 'selected' : ''}`}
                            onClick={() => onSelect(theme.id)}
                            style={{
                                '--theme-primary': theme.preview.primaryColor,
                                '--theme-secondary': theme.preview.secondaryColor,
                                '--theme-accent': theme.preview.accentColor,
                                '--theme-bg': theme.preview.backgroundColor,
                            } as React.CSSProperties}
                        >
                            {/* Selection indicator */}
                            {isSelected && (
                                <div className="theme-selected-badge">
                                    <Check size={14} />
                                </div>
                            )}

                            {/* Theme preview */}
                            <div
                                className="theme-preview"
                                style={{ backgroundColor: theme.preview.backgroundColor }}
                            >
                                {/* Mock sidebar */}
                                <div className="preview-sidebar" style={{
                                    background: theme.id === 'neon_glow'
                                        ? '#0F172A'
                                        : `linear-gradient(180deg, ${theme.preview.primaryColor}, ${theme.preview.secondaryColor})`
                                }}>
                                    <div className="preview-sidebar-item active" />
                                    <div className="preview-sidebar-item" />
                                    <div className="preview-sidebar-item" />
                                </div>

                                {/* Mock content area */}
                                <div className="preview-content">
                                    {/* Mock header */}
                                    <div className="preview-header">
                                        <div className="preview-title" />
                                        <div
                                            className="preview-button"
                                            style={{ backgroundColor: theme.preview.primaryColor }}
                                        />
                                    </div>

                                    {/* Mock cards */}
                                    <div className="preview-cards">
                                        <div className="preview-card">
                                            <div
                                                className="preview-icon"
                                                style={{
                                                    backgroundColor: `${theme.preview.primaryColor}20`,
                                                    color: theme.preview.primaryColor
                                                }}
                                            >
                                                {themeIcons[theme.id]}
                                            </div>
                                        </div>
                                        <div className="preview-card">
                                            <div
                                                className="preview-icon"
                                                style={{
                                                    backgroundColor: `${theme.preview.accentColor}20`,
                                                    color: theme.preview.accentColor
                                                }}
                                            >
                                                {themeIcons[theme.id]}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Theme info */}
                            <div className="theme-info">
                                <h4 className="theme-name">{theme.name}</h4>
                                <p className="theme-desc">{theme.description}</p>
                            </div>

                            {/* Color swatches */}
                            <div className="theme-swatches">
                                <div
                                    className="swatch"
                                    style={{ backgroundColor: theme.preview.primaryColor }}
                                    title="Primary"
                                />
                                <div
                                    className="swatch"
                                    style={{ backgroundColor: theme.preview.secondaryColor }}
                                    title="Secondary"
                                />
                                <div
                                    className="swatch"
                                    style={{ backgroundColor: theme.preview.accentColor }}
                                    title="Accent"
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default IconThemeSelector;
