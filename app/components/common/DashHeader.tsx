import { Fragment } from "react";
import { UserIcon } from "@heroicons/react/24/solid";
import { Menu, Transition } from "@headlessui/react";

import { SessionUser } from "@/lib/services/session-service";

export default function DashHeader({ user }: { user: SessionUser }) {
  return (
    <nav className="flex h-14 items-center justify-between border-b border-b-gray-200 bg-gray-50 px-4 md:px-8">
      <div className="relative grow-0">
        <a
          href="/dash/home"
          className="z-1 bg-gray-50 text-xl font-bold tracking-tight md:text-2xl"
        >
          <span className="text-primary pointer-events-none">Snap</span>
          <span className="text-secondary pointer-events-none">Safe</span>
        </a>
      </div>
      <Menu as="div" className="relative">
        <Menu.Button className="bg-primary flex size-9 items-center justify-center rounded-full border border-gray-300 font-bold text-white shadow">
          {user.firstName ? (
            user.firstName.slice(0, 1)
          ) : (
            <UserIcon className="size-5" />
          )}
        </Menu.Button>
        <Transition
          as={Fragment}
          enter="transition ease-out duration-200"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute right-0 mt-2 w-52 origin-bottom-right scale-100 transform divide-y divide-gray-100 rounded-md bg-white py-1 opacity-100 shadow-lg ring-1 ring-black/5 focus:outline-none">
            <Menu.Item>
              {({ active }) => (
                <a
                  href="/sign-out"
                  className={`block px-4 py-2 text-sm ${
                    active ? "bg-gray-100" : ""
                  }`}
                >
                  Logout
                </a>
              )}
            </Menu.Item>
          </Menu.Items>
        </Transition>
      </Menu>
    </nav>
  );
}
