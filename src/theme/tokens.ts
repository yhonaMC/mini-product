export const lightColors = {
  background: '#F6F7FB',
  surface: '#FFFFFF',
  text: '#17233B',
  secondary: '#526078',
  primary: '#275BC4',
  onPrimary: '#FFFFFF',
  border: '#DCE2ED',
  danger: '#B4233A',
  skeleton: '#DFE5EF',
  success: '#15724F',
};

export type ThemeColors = { [Key in keyof typeof lightColors]: string };

export const darkColors: ThemeColors = {
  background: '#111827',
  surface: '#1C273B',
  text: '#F2F5FC',
  secondary: '#B8C4D9',
  primary: '#9BBCFF',
  onPrimary: '#122448',
  border: '#3B4961',
  danger: '#FF9DAE',
  skeleton: '#34435B',
  success: '#76DCB2',
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
