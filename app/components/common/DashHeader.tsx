import { Fragment } from "react";
import { UserIcon, PlusIcon } from "@heroicons/react/24/outline";
import { Menu, Transition } from "@headlessui/react";
import { Link } from "@remix-run/react";

export default function DashHeader({ user }: { user: { firstName: string } | null }) {
  return (
    <nav className="flex h-14 items-center justify-between border-b border-b-gray-200 bg-gray-50 px-4 md:px-8">
      <div className="relative grow-0">
        <a
          href="/"
          className="z-1 bg-gray-50 text-xl font-bold tracking-tight md:text-2xl"
        >
          <span className="text-primary pointer-events-none">Snap</span>
          <span className="text-secondary pointer-events-none">Safe</span>
        </a>
      </div>
      {user && (
        <div className="flex gap-4 justify-center items-center">
          <Link
            to="/albums/create"
            className="transition-colors flex justify-center items-center text-sm text-gray-600 md:rounded-md rounded-full hover:bg-gray-300 py-2 px-2"
          >
            <span className="md:inline hidden">Create album</span>
            <PlusIcon className="md:ml-1 md:size-5 size-6 stoke-2" />
          </Link>
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
                      className={`block px-4 py-2 text-sm ${active ? "bg-gray-100" : ""}`}
                    >
                      Logout
                    </a>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      )}
    </nav>
  );
}
