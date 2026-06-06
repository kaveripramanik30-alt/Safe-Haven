// src/styles/theme.js
export const COLORS = {
  // Base background and surface colors
  background: '#0B0C10',       // Deep obsidian black
  surface: '#1E293B',          // Dark Slate card surface
  surfaceLight: '#334155',     // Lighter Slate for active status or borders
  border: '#475569',           // Slate border color

  // Accents and semantic colors
  danger: '#FF3366',           // Electric Coral/Crimson for SOS/Danger
  dangerGlow: 'rgba(255, 51, 102, 0.4)',
  
  warning: '#F59E0B',          // Amber for Moderate Risk
  warningGlow: 'rgba(245, 158, 11, 0.3)',
  
  safe: '#10B981',             // Emerald Green for Safe Areas
  safeGlow: 'rgba(16, 185, 129, 0.2)',
  
  info: '#3B82F6',             // Electric Blue for Navigation/Safest Route
  infoGlow: 'rgba(59, 130, 246, 0.2)',

  // Typography
  textPrimary: '#F8FAFC',      // Slate 50 (near white)
  textSecondary: '#94A3B8',    // Slate 400 (slate gray)
  textMuted: '#64748B',        // Slate 500 (muted gray)
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const BORDER_RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 9999,
};

export const SHADOWS = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  glowDanger: {
    shadowColor: COLORS.danger,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 12,
  },
  glowInfo: {
    shadowColor: COLORS.info,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
  },
};
