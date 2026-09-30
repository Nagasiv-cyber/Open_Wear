'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/', label: 'Find an outfit' },
  { href: '/list', label: 'Lend an outfit' },
  { href: '/rentals', label: 'My rentals' },
  { href: '/inbox', label: 'Lender inbox' },
  { href: '/how', label: 'How it works' },
];

export default function Header() {
  const path = usePathname();
  return (
    <header className="site-header">
      <div className="wrap">
        <Link href="/" className="logo">
          <span className="logo-mark" aria-hidden="true" />
          OneWear
        </Link>
        <nav className="nav" aria-label="Main">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} aria-current={path === l.href ? 'page' : undefined}>
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
