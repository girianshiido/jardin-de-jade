import type { Metadata, Viewport } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Jardin de Jade — Mahjong solitaire',
  description:
    'Quinze jardins de Mahjong aux formes variées, avec des voies à débloquer sur ordinateur, téléphone et tablette.',
  applicationName: 'Jardin de Jade',
  manifest: 'manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Jardin de Jade',
  },
  icons: {
    icon: [
      { url: 'favicon.svg', type: 'image/svg+xml' },
      { url: 'icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: { url: 'apple-touch-icon.png', sizes: '180x180' },
  },
  robots: { index: false, follow: false },
};
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#082c2b',
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
