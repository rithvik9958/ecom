'use client';
import React from 'react';

export const SOCIAL_PLATFORMS_CATALOG = [
  { id: 'instagram', label: 'Instagram', defaultUrl: 'https://instagram.com', brandColor: '#E1306C', hoverBg: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' },
  { id: 'facebook', label: 'Facebook', defaultUrl: 'https://facebook.com', brandColor: '#1877F2', hoverBg: '#1877F2' },
  { id: 'youtube', label: 'YouTube', defaultUrl: 'https://youtube.com', brandColor: '#FF0000', hoverBg: '#FF0000' },
  { id: 'pinterest', label: 'Pinterest', defaultUrl: 'https://pinterest.com', brandColor: '#E60023', hoverBg: '#E60023' },
  { id: 'linkedin', label: 'LinkedIn', defaultUrl: 'https://linkedin.com', brandColor: '#0A66C2', hoverBg: '#0A66C2' },
  { id: 'twitter', label: 'X (Twitter)', defaultUrl: 'https://x.com', brandColor: '#000000', hoverBg: '#000000' },
  { id: 'whatsapp', label: 'WhatsApp', defaultUrl: 'https://whatsapp.com', brandColor: '#25D366', hoverBg: '#25D366' },
  { id: 'threads', label: 'Threads', defaultUrl: 'https://threads.net', brandColor: '#000000', hoverBg: '#101010' },
  { id: 'telegram', label: 'Telegram', defaultUrl: 'https://telegram.org', brandColor: '#229ED9', hoverBg: '#229ED9' },
  { id: 'tiktok', label: 'TikTok', defaultUrl: 'https://tiktok.com', brandColor: '#000000', hoverBg: '#010101' },
  { id: 'discord', label: 'Discord', defaultUrl: 'https://discord.com', brandColor: '#5865F2', hoverBg: '#5865F2' },
  { id: 'github', label: 'GitHub', defaultUrl: 'https://github.com', brandColor: '#181717', hoverBg: '#181717' }
];

export function getPlatformMeta(platformName = '') {
  const norm = (platformName || '').trim().toLowerCase();
  if (norm.includes('insta') || norm === 'ig') return SOCIAL_PLATFORMS_CATALOG[0];
  if (norm.includes('face') || norm === 'fb') return SOCIAL_PLATFORMS_CATALOG[1];
  if (norm.includes('you') || norm === 'yt') return SOCIAL_PLATFORMS_CATALOG[2];
  if (norm.includes('pin') || norm === 'pi') return SOCIAL_PLATFORMS_CATALOG[3];
  if (norm.includes('link') || norm === 'in') return SOCIAL_PLATFORMS_CATALOG[4];
  if (norm.includes('twit') || norm.includes('x') || norm === 'x') return SOCIAL_PLATFORMS_CATALOG[5];
  if (norm.includes('whats') || norm.includes('wa')) return SOCIAL_PLATFORMS_CATALOG[6];
  if (norm.includes('thread')) return SOCIAL_PLATFORMS_CATALOG[7];
  if (norm.includes('tele')) return SOCIAL_PLATFORMS_CATALOG[8];
  if (norm.includes('tik')) return SOCIAL_PLATFORMS_CATALOG[9];
  if (norm.includes('disc')) return SOCIAL_PLATFORMS_CATALOG[10];
  if (norm.includes('git')) return SOCIAL_PLATFORMS_CATALOG[11];
  return { id: 'custom', label: platformName, defaultUrl: '#', brandColor: '#475569', hoverBg: '#0f172a' };
}

export default function SocialIcon({ platform = '', size = 16, className = '' }) {
  const norm = (platform || '').trim().toLowerCase();

  // Instagram
  if (norm.includes('insta') || norm === 'ig') {
    return (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`social-svg social-instagram ${className}`}
      >
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
      </svg>
    );
  }

  // Facebook
  if (norm.includes('face') || norm === 'fb') {
    return (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="currentColor"
        className={`social-svg social-facebook ${className}`}
      >
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    );
  }

  // YouTube
  if (norm.includes('you') || norm === 'yt') {
    return (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="currentColor"
        className={`social-svg social-youtube ${className}`}
      >
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    );
  }

  // Pinterest
  if (norm.includes('pin') || norm === 'pi') {
    return (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="currentColor"
        className={`social-svg social-pinterest ${className}`}
      >
        <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.171-2.911 1.024 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146 1.124.347 2.317.535 3.554.535 6.627 0 12-5.373 12-12 0-6.62-5.373-11.987-12-11.987z" />
      </svg>
    );
  }

  // LinkedIn
  if (norm.includes('link') || norm === 'in') {
    return (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="currentColor"
        className={`social-svg social-linkedin ${className}`}
      >
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
      </svg>
    );
  }

  // Twitter / X
  if (norm.includes('twit') || norm.includes('x') || norm === 'x') {
    return (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="currentColor"
        className={`social-svg social-x ${className}`}
      >
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    );
  }

  // WhatsApp
  if (norm.includes('whats') || norm.includes('wa')) {
    return (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="currentColor"
        className={`social-svg social-whatsapp ${className}`}
      >
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
      </svg>
    );
  }

  // Threads
  if (norm.includes('thread')) {
    return (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="currentColor"
        className={`social-svg social-threads ${className}`}
      >
        <path d="M12.186 24C5.468 24 0 18.532 0 11.814 0 5.096 5.468 0 12.186 0c6.643 0 11.956 5.253 12.062 11.874v.266c0 .762-.619 1.381-1.381 1.381-.762 0-1.381-.619-1.381-1.381v-.266C21.418 5.767 17.202 2.762 12.186 2.762c-5.234 0-9.424 4.19-9.424 9.424 0 5.234 4.19 9.424 9.424 9.424 3.738 0 7.02-2.179 8.447-5.57.295-.705 1.111-1.037 1.816-.742.705.295 1.037 1.111.742 1.816C20.912 21.056 16.828 24 12.186 24zm4.869-12.75c0-3.32-2.427-5.184-5.011-5.184-2.88 0-5.143 2.222-5.143 5.097 0 2.929 2.263 5.26 5.259 5.26 1.734 0 3.325-.79 4.301-2.134.457-.629 1.336-.763 1.965-.306.629.457.763 1.336.306 1.965-1.42 1.956-3.714 3.097-6.31 3.097-4.394 0-7.882-3.414-7.882-7.72 0-4.225 3.376-7.72 7.766-7.72 3.968 0 7.502 2.825 7.502 7.502 0 .976-.144 2.052-.449 3.09-.434 1.479-1.284 2.748-2.463 3.668-1.505 1.176-3.36 1.802-5.32 1.802-1.326 0-2.428-.403-3.189-1.165-.87-.872-1.233-2.115-1.021-3.5.385-2.518 2.56-4.417 5.074-4.417 1.365 0 2.457.545 3.078 1.451l.142-.23c0-.022 0-.044.004-.066zm-5.011 2.578c-1.272 0-2.392.936-2.576 2.138-.112.735.092 1.393.574 1.875.405.405 1.002.614 1.728.614 1.439 0 2.793-.45 3.818-1.266.697-.556 1.218-1.319 1.509-2.207.199-.607.301-1.228.301-1.848v-.058c-.528-.79-1.423-1.248-2.482-1.248-1.378 0-2.872 1.002-2.872 2z" />
      </svg>
    );
  }

  // Telegram
  if (norm.includes('tele')) {
    return (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="currentColor"
        className={`social-svg social-telegram ${className}`}
      >
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18.718-1.45 6.818-2.102 9.87-.275 1.29-.809 1.502-1.332 1.521-.762.027-1.341-.497-2.078-.98-1.155-.758-1.808-1.23-2.928-1.968-1.294-.853-.455-1.322.283-2.088.193-.2 3.545-3.25 3.61-3.527.008-.035.015-.164-.062-.233-.076-.068-.19-.045-.272-.026-.116.026-1.959 1.246-5.53 3.658-.523.36-1 .536-1.424.527-.47-.01-1.374-.265-2.046-.484-.824-.269-1.48-.411-1.423-.868.03-.238.358-.482.983-.733 3.86-1.682 6.435-2.791 7.726-3.327 3.67-1.526 4.433-1.791 4.93-1.8.109-.002.355.025.514.154.135.109.172.256.19.36.018.104.013.328-.007.476z" />
      </svg>
    );
  }

  // Generic globe fallback
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`social-svg social-generic ${className}`}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" x2="22" y1="12" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}
