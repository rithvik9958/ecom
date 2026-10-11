export const dynamic = 'force-dynamic';
import { getEcomTheme, DEFAULT_ECOM_THEME } from '@/app/models/EcomTheme';
import GlobalSetting from '@/app/models/GlobalSetting';

export async function GET() {
  try {
    const Theme = await getEcomTheme();
    let theme = await Theme.findOne({ id: 'global' }).lean();
    const gs = await GlobalSetting.findOne().lean().catch(() => null);

    if (!theme) {
      theme = DEFAULT_ECOM_THEME;
    }

    const effectiveLogo = (theme.logo && theme.logo !== '/logo.png') 
      ? theme.logo 
      : (gs?.logoImage || theme.logo || '/logo.png');

    const effectiveFavicon = (theme.favicon && theme.favicon !== '/favicon.ico') 
      ? theme.favicon 
      : (gs?.favicon || theme.favicon || '/favicon.ico');

    const effectiveBrandName = theme.brandName || gs?.adminTitle || 'EShop';

    return Response.json({
      success: true,
      theme: {
        ...DEFAULT_ECOM_THEME,
        ...theme,
        logo: effectiveLogo,
        favicon: effectiveFavicon,
        brandName: effectiveBrandName,
        lightMode: { ...DEFAULT_ECOM_THEME.lightMode, ...(theme.lightMode || {}) },
        darkMode: { ...DEFAULT_ECOM_THEME.darkMode, ...(theme.darkMode || {}) }
      }
    });
  } catch (error) {
    return Response.json({ success: false, theme: DEFAULT_ECOM_THEME });
  }
}
