import React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Disclosure } from '@headlessui/react';
import { IconMenu2, IconX } from '@tabler/icons';
import DunlinIcon from 'components/DunlinIcon';

const items = [
  { href: '/docs', active: '/docs', children: 'Overview' },
  { href: '/docs/core-concepts', active: '/docs/core-concepts', children: 'Core concepts' },
  { href: '/docs/user-reference', active: '/docs/user-reference', children: 'User reference' },
  { href: '/docs/faq', active: '/docs/faq', children: 'FAQ' },
];

export default function Sidebar() {
  const router = useRouter();

  return (
    <Disclosure as="nav">
      {({ open }) => (
        <>
          <div className="fixed h-screen flex-[0_0_auto] py-12 border-r border-gray-600 bg-gray-800">
            <div className="relative items-center justify-between">
              <div className="absolute inset-y-0 left-0 flex items-center md:hidden">
                <Disclosure.Button className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                  <span className="sr-only">Open navigation</span>
                  {open ? <IconX size={20} aria-hidden="true" /> : <IconMenu2 size={20} aria-hidden="true" />}
                </Disclosure.Button>
              </div>
              <div className="flex-1 flex items-center justify-center md:items-stretch md:justify-start">
                <div className="hidden md:block">
                  <ul className="flex flex-col">
                    <Link
                      href="/"
                      className={`w-full flex focus:outline-none hover:bg-gray-800 border-b border-gray-600`}
                    >
                      <li className="list-none flex items-center px-8 py-1 my-1 w-full">
                        <DunlinIcon />
                        <div className="ml-2">Dunlin</div>
                      </li>
                    </Link>
                    {items.map(link => {
                      const active = router.asPath === link.href;
                      return (
                        <Link
                          {...link}
                          key={link.href}
                          className={`w-full focus:outline-none hover:bg-gray-700 ${
                            active ? 'bg-gray-700 text-primary-400' : ''
                          }`}
                        >
                          <li className="list-none px-8 py-1 my-1 w-full">{link.children}</li>
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
                const active = router.asPath === link.href;
                return (
                  <Disclosure.Button as="li" className="list-none px-8 py-1 my-1 w-full" key={link.href}>
                    <Link
                      {...link}
                      href={link.href}
                      className={`w-full focus:outline-none hover:text-primary-400 ${active ? 'text-primary-400' : ''}`}
                    >
                      {link.children}
                    </Link>
                  </Disclosure.Button>
                );
              })}
            </ul>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}
