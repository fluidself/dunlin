import React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Disclosure } from '@headlessui/react';
import { IconMenu2, IconX } from '@tabler/icons';

const items = [
  { href: '/docs', children: 'Overview' },
  { href: '/docs/core-concepts', children: 'Core concepts' },
  { href: '/docs/user-reference', children: 'User reference' },
  { href: '/docs/faq', children: 'FAQ' },
];

export default function Sidebar() {
  const router = useRouter();

  return (
    <Disclosure as="nav">
      {({ open }) => (
        <>
          <div className="fixed h-screen flex-[0_0_auto] py-12 border-r border-gray-600">
            <div className="relative items-center justify-between">
              <div className="absolute inset-y-0 left-0 flex items-center md:hidden">
                <Disclosure.Button className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                  <span className="sr-only">Open navigation</span>
                  {open ? (
                    <IconX className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <IconMenu2 className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
              <div className="flex-1 flex items-center justify-center md:items-stretch md:justify-start">
                <div className="hidden md:block">
                  <ul className="flex flex-col">
                    {items.map(link => {
                      const active = router.query.slug === link.href.split('/')[2];
                      return (
                        <Link {...link} key={link.href}>
                          <a
                            href={link.href}
                            className={`w-full focus:outline-none hover:bg-gray-800 ${
                              active ? 'bg-gray-800 text-primary-500' : ''
                            }`}
                          >
                            <li className="list-none px-8 py-1 my-1 w-full">{link.children}</li>
                          </a>
                        </Link>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <Disclosure.Panel className="md:hidden">
            <ul className="flex flex-col mt-16 mb-[-46px]">
              {items.map(link => {
                const active = router.query.slug === link.href.split('/')[2];
                return (
                  <Link {...link} key={link.href}>
                    <a
                      href={link.href}
                      className={`w-full focus:outline-none hover:bg-gray-800 ${active ? 'bg-gray-800 text-primary-500' : ''}`}
                    >
                      <li className="list-none px-8 py-1 my-1 w-full">{link.children}</li>
                    </a>
                  </Link>
                );
              })}
            </ul>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}
