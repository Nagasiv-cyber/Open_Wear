import './globals.css';
import Header from '@/components/Header';

export const metadata = {
  title: 'OneWear: rent the outfit, not the wardrobe',
  description: 'Describe your occasion and find outfits that fit you, your budget and your date, from people near you in Chennai.',
};

export const viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&display=swap"
        />
      </head>
      <body>
        <Header />
        <main>{children}</main>
        <footer className="site-footer">
          <div className="wrap">
            OneWear prototype for HACKXPRESS 1.0, problem statement 4. Includes sample listings from across Chennai.
          </div>
        </footer>
      </body>
    </html>
  );
}
