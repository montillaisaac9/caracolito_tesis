// app/config/colors.ts
export const colors = {
  // Main background or dark headers
  primary: '#1E0A63',
  // Accents or borders
  secondary: '#241476',
  // Highlighted text or icons
  accent: '#A4DAF6',
  // Secondary backgrounds or hover states
  lightSecondary: '#D3F0FF',
  // General background or light sections
  background: '#F2FBFF',
  
  // Status colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Text colors
  text: {
    primary: '#1F2937',
    secondary: '#4B5563',
    light: '#F9FAFB',
    dark: '#111827',
  },
  
  // Button variants
  button: {
    primary: {
      bg: '#1E0A63',
      hover: '#241476',
      text: '#FFFFFF',
    },
    secondary: {
      bg: '#D3F0FF',
      hover: '#A4DAF6',
      text: '#1E0A63',
    },
    accent: {
      bg: '#A4DAF6',
      hover: '#8BC4E5',
      text: '#1E0A63',
    },
  },
} as const;
