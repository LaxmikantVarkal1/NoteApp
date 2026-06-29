/**
 * Below are the colors and typography used across the app.
 */

import { Platform } from 'react-native';

const tintColorLight = '#FF6347'; // Centralized primary accent tint color (TOMATO_RED)
const tintColorDark = '#FF6347';

interface CustomFont {
  url: string;
  name: string;
}

export const CustomFonts: Record<string, CustomFont> = {
  Ubuntu: {
    url: "https://fonts.googleapis.com/css2?family=Ubuntu:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400;1,500;1,700&display=swap",
    name: "Ubuntu"
  },
  Poppins: {
    url: "https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap",
    name: "Poppins"
  },
  Inter: {
    url: "https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap",
    name: "Inter"
  },
  Roboto: {
    url: "https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap",
    name: "Roboto"
  }
};

export const Typography = {
  light: 'GoogleSans-Regular',
  regular: 'GoogleSans-Regular',
  medium: 'GoogleSans-Medium',
  bold: 'GoogleSans-Bold',
  semiBold: 'GoogleSans-SemiBold',
  italic: 'GoogleSans-Italic',
};

export const NoteColors = {
  light: ['#FFFFFF', '#FFD1CA', '#CFF1D7', '#D0E6F9', '#FFF3B8'],
  dark: ['#111111', '#4A1D1A', '#1C3322', '#1B2C3B', '#3B3A1C'],
};
// let color = rgb(122, 218, 165)
let primary = ' rgb(122, 218, 165, --opacity--)';

function getColor(opacity: number) {
  return primary.replace('--opacity--', opacity.toString())
}

export const Colors = {
  light: {
    text: '#333333',
    subtitle: '#666666',
    background: '#FFFFFF',
    cardBackground: '#FFFFFF',
    border: '#eeeeee17',
    borderLight: '#CCC',
    borderDark: '#555',
    itemBg: '#F9F9F9',
    tomatoRed: '#FF6347',
    tint: tintColorLight,
    icon: '#666666',
    iconSubtle: '#33333343',
    iconActive: '#000000ff',
    placeholder: '#888888',
    tagChipBg: '#f1f3f435',
    tagChipText: '#333333',
    bottomBarBg: '#F8F9FA',
    formatBarBg: '#ffffffdd',
    menuBg: '#FFFFFF',
    menuBorder: '#E8E8E8',
    menuText: '#333333',
    menuIcon: '#666666',
    deleteColor: '#E53935',
    statLabel: '#666666',
    statValue: '#333333',
    infoBannerBg: '#F1F3F4',
    tabActiveBg: '#FFF0EE',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ffffffc2',
    subtitle: '#AAAAAA',
    background: '#0c0d0eff',
    cardBackground: '#202026ff',
    border: '#3333334f',
    borderLight: '#555',
    borderDark: getColor(0.3),
    itemBg: '#222222',
    tomatoRed: getColor(0.8),
    tint: getColor(0.8),
    icon: '#aaaaaaef',
    iconSubtle: '#ffffff62',
    iconActive: '#ffffffff',
    placeholder: '#AAAAAA',
    tagChipBg: '#ffffff19',
    tagChipText: '#FFFFFF',
    bottomBarBg: '#222222',
    formatBarBg: '#ffffff10',
    menuBg: '#222222',
    menuBorder: '#333333',
    menuText: '#FFFFFF',
    menuIcon: '#AAAAAA',
    deleteColor: '#FF6B6B',
    statLabel: '#AAAAAA',
    statValue: '#FFFFFF',
    infoBannerBg: '#222222',
    tabActiveBg: getColor(0.04),
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

