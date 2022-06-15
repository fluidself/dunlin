import React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

const items = [
  { href: '/docs/overview', children: 'Overview' },
  { href: '/docs/faq', children: 'FAQ' },
];

export default function Sidebar() {
  const router = useRouter();

  return (
    <nav className="sticky h-screen flex-[0_0_auto] overflow-y-auto py-6  border-r border-gray-600">
      <ul className="flex flex-col">
        {items.map(link => {
          const active = router.query.slug === link.href.split('/')[2];
          return (
            <li key={link.href} className={`list-none px-8 py-1 my-1 w-full ${active ? 'bg-gray-800 text-[#ec4899]' : ''}`}>
              <Link {...link}>
                <a href={link.href}>{link.children}</a>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
