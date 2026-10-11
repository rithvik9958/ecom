import { connectDB } from 'src/app/lib/config';
import GlobalSetting from 'src/app/models/GlobalSetting';

export async function GET() {
  try {
    await connectDB();
    const settings = await GlobalSetting.findOne().lean();
    const content = settings?.robotsTxt || 'User-agent: *\nAllow: /\n\nSitemap: https://jindalmetal.com/sitemap.xml';
    return new Response(content, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch {
    return new Response('User-agent: *\nAllow: /', {
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}
