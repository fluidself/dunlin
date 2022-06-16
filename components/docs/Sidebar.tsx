import React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

const items = [
  { href: '/docs', children: 'Overview' },
  { href: '/docs/core-concepts', children: 'Core concepts' },
  { href: '/docs/user-reference', children: 'User reference' },
  { href: '/docs/faq', children: 'FAQ' },
];

export default function Sidebar() {
  const router = useRouter();

  return (
    <nav className="fixed h-screen flex-[0_0_auto] py-12 border-r border-gray-600">
      <ul className="flex flex-col">
        {items.map(link => {
          const active = router.query.slug === link.href.split('/')[2];
          return (
            <Link {...link} key={link.href}>
              <a href={link.href} className="w-full focus:outline-none">
                <li className={`list-none lg:px-8 py-1 my-1 w-full ${active ? 'bg-gray-800 text-[#ec4899]' : ''}`}>
                  {link.children}
                </li>
              </a>
            </Link>
          );
        })}
      </ul>
    </nav>
  );
}
