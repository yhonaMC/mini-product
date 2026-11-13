export const lightColors = {
  background: '#F7F8FA',
  surface: '#FFFFFF',
  imageSurface: '#F0F2F5',
  text: '#1C2534',
  secondary: '#596579',
  primary: '#2459BA',
  primarySoft: '#EAF0FC',
  onPrimary: '#FFFFFF',
  border: '#DFE3EA',
  danger: '#B4233A',
  skeleton: '#DFE5EF',
  success: '#15724F',
  successSoft: '#E7F3EC',
  rating: '#9A640C',
};

export type ThemeColors = { [Key in keyof typeof lightColors]: string };

export const darkColors: ThemeColors = {
  background: '#12161D',
  surface: '#1D232D',
  imageSurface: '#282F3A',
  text: '#F1F3F7',
  secondary: '#B0BBCD',
  primary: '#A6C1FF',
  primarySoft: '#283854',
  onPrimary: '#122448',
  border: '#374151',
  danger: '#FF9DAE',
  skeleton: '#34435B',
  success: '#76DCB2',
  successSoft: '#203C32',
  rating: '#F1C36C',
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
