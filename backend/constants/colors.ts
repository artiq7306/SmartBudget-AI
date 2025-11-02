const Colors = {
  primary: '#6C5CE7',
  primaryDark: '#5849C7',
  secondary: '#00B894',
  accent: '#FD79A8',
  warning: '#FDCB6E',
  danger: '#FF7675',
  success: '#55EFC4',
  
  background: '#F8F9FA',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  
  text: '#2D3436',
  textSecondary: '#636E72',
  textLight: '#B2BEC3',
  
  border: '#DFE6E9',
  divider: '#ECF0F1',
  
  income: '#00B894',
  expense: '#FF7675',
  
  shadow: 'rgba(0, 0, 0, 0.08)',
  shadowDark: 'rgba(0, 0, 0, 0.15)',
  
  overlay: 'rgba(0, 0, 0, 0.5)',
  
  categories: {
    food: '#E17055',
    transport: '#6C5CE7',
    entertainment: '#FD79A8',
    shopping: '#FDCB6E',
    bills: '#74B9FF',
    health: '#55EFC4',
    education: '#A29BFE',
    other: '#B2BEC3',
  },
};

export default {
  light: {
    ...Colors,
    tint: Colors.primary,
    tabIconDefault: Colors.textLight,
    tabIconSelected: Colors.primary,
  },
};
