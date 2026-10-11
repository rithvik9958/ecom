import mongoose from 'mongoose';
import { connectDB } from '@/app/lib/config';

export const DEFAULT_ECOM_THEME = {
  id: 'global',
  presetName: 'Luxury Obsidian & Gold',
  brandName: 'EShop',
  logo: '/logo.png',
  darkLogo: '',
  favicon: '/favicon.ico',
  adminLogo: '',
  adminTitle: 'EShop Admin',
  logoHeight: 48,
  primaryColor: '#111111',
  secondaryColor: '#1e293b',
  accentColor: '#c59b27',
  defaultThemeMode: 'light',
  lightMode: {
    bg: '#ffffff',
    surface: '#ffffff',
    text: '#111111',
    muted: '#64748b',
    border: '#e2e8f0'
  },
  darkMode: {
    bg: '#0b0f19',
    surface: '#111827',
    text: '#f8fafc',
    muted: '#94a3b8',
    border: 'rgba(255, 255, 255, 0.12)'
  },
  customPresets: [],
  customDashboardPresets: [],
  dashboardTheme: {
    presetName: 'Midnight Indigo',
    primaryColor: '#3b82f6',
    accentColor: '#6366f1',
    sidebarBg: '#0f172a',
    background: '#0b0f19',
    cardBg: '#1e293b',
    borderRadius: '0.75rem',
    glassmorphism: true,
  }
};

const themeSchema = new mongoose.Schema({
  id: { type: String, required: true, default: 'global' },
  presetName: { type: String, default: 'Luxury Obsidian & Gold' },
  brandName: { type: String, default: 'EShop' },
  logo: { type: String, default: '/logo.png' },
  darkLogo: { type: String, default: '' },
  favicon: { type: String, default: '/favicon.ico' },
  adminLogo: { type: String, default: '' },
  adminTitle: { type: String, default: 'EShop Admin' },
  logoHeight: { type: Number, default: 48 },
  primaryColor: { type: String, default: '#111111' },
  secondaryColor: { type: String, default: '#1e293b' },
  accentColor: { type: String, default: '#c59b27' },
  defaultThemeMode: { type: String, default: 'light' },
  lightMode: {
    type: mongoose.Schema.Types.Mixed,
    default: DEFAULT_ECOM_THEME.lightMode
  },
  darkMode: {
    type: mongoose.Schema.Types.Mixed,
    default: DEFAULT_ECOM_THEME.darkMode
  },
  dashboardTheme: {
    type: mongoose.Schema.Types.Mixed,
    default: DEFAULT_ECOM_THEME.dashboardTheme
  },
  customPresets: {
    type: Array,
    default: []
  },
  customDashboardPresets: {
    type: Array,
    default: []
  }
}, { timestamps: true, strict: false });

if (mongoose.models['EcomTheme']) {
    delete mongoose.models['EcomTheme'];
}

export async function getEcomTheme() {
  await connectDB();
  return mongoose.models.EcomTheme || mongoose.model('EcomTheme', themeSchema);
}

export default mongoose.models.EcomTheme || mongoose.model('EcomTheme', themeSchema);
