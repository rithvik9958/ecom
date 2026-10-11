import ThemeClient from './ThemeClient';

export const metadata = {
  title: 'Global Theme Settings | Admin',
};

export default function ThemePage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Global Theme Settings</h1>
      <ThemeClient />
    </div>
  );
}
