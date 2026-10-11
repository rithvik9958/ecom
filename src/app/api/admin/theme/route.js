export const dynamic = 'force-dynamic';
import { getEcomTheme, DEFAULT_ECOM_THEME } from '@/app/models/EcomTheme';
import GlobalSetting from '@/app/models/GlobalSetting';
import { requirePermission } from '@/app/lib/auth';

export async function GET(request) {
  try {
    const Theme = await getEcomTheme();
    let theme = await Theme.findOne({ id: 'global' }).lean();
    
    if (!theme) {
      theme = DEFAULT_ECOM_THEME;
    }
    
    return Response.json({
      success: true,
      theme: {
        ...DEFAULT_ECOM_THEME,
        ...theme,
        adminLogo: theme.adminLogo || theme.logo || DEFAULT_ECOM_THEME.adminLogo,
        adminTitle: theme.adminTitle || theme.brandName || DEFAULT_ECOM_THEME.adminTitle,
        dashboardTheme: theme.dashboardTheme || DEFAULT_ECOM_THEME.dashboardTheme,
        lightMode: { ...DEFAULT_ECOM_THEME.lightMode, ...(theme.lightMode || {}) },
        darkMode: { ...DEFAULT_ECOM_THEME.darkMode, ...(theme.darkMode || {}) },
        customPresets: theme.customPresets || [],
        customDashboardPresets: theme.customDashboardPresets || []
      }
    });
  } catch (error) {
    return Response.json({ success: false, message: "Failed to fetch theme", error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const data = await request.json();
    const Theme = await getEcomTheme();
    
    let theme = await Theme.findOne({ id: 'global' });
    
    if (!theme) {
      theme = new Theme({ id: 'global' });
    }
    
    if (data.presetName) theme.presetName = data.presetName;
    if (data.brandName !== undefined) theme.brandName = data.brandName;
    if (data.logo !== undefined) theme.logo = data.logo;
    if (data.darkLogo !== undefined) theme.darkLogo = data.darkLogo;
    if (data.favicon !== undefined) theme.favicon = data.favicon;
    if (data.adminLogo !== undefined) theme.adminLogo = data.adminLogo;
    if (data.adminTitle !== undefined) theme.adminTitle = data.adminTitle;
    if (data.dashboardTheme) theme.dashboardTheme = data.dashboardTheme;
    if (Array.isArray(data.customDashboardPresets)) theme.customDashboardPresets = data.customDashboardPresets;
    if (data.logoHeight !== undefined) theme.logoHeight = Number(data.logoHeight) || 48;
    if (data.primaryColor) theme.primaryColor = data.primaryColor;
    if (data.secondaryColor) theme.secondaryColor = data.secondaryColor;
    if (data.accentColor) theme.accentColor = data.accentColor;
    if (data.defaultThemeMode) theme.defaultThemeMode = data.defaultThemeMode;
    if (data.lightMode) theme.lightMode = data.lightMode;
    if (data.darkMode) theme.darkMode = data.darkMode;
    if (Array.isArray(data.customPresets)) theme.customPresets = data.customPresets;
    
    await theme.save();

    // Synchronize to GlobalSetting to ensure zero discrepancy
    try {
      let gs = await GlobalSetting.findOne();
      if (!gs) gs = new GlobalSetting();
      if (data.brandName) gs.adminTitle = data.brandName;
      if (data.adminTitle) gs.adminTitle = data.adminTitle;
      if (data.adminLogo !== undefined) gs.adminLogo = data.adminLogo;
      if (data.logo) gs.logoImage = data.logo;
      if (data.favicon) gs.favicon = data.favicon;
      await gs.save();
    } catch (e) {
      console.error('Failed to sync to GlobalSetting:', e);
    }
    
    return Response.json({
      success: true,
      theme
    });
  } catch (error) {
    console.error("Theme Update Error:", error);
    return Response.json({ success: false, message: "Failed to update theme", error: error.message }, { status: 500 });
  }
}
