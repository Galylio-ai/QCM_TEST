import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'QCM Ambassadeur Marketplace',
  description: 'QCM Psychotechnique pour le recrutement Ambassadeur Marketplace'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
