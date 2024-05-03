import { PhotoIcon, UserGroupIcon } from "@heroicons/react/24/solid";
import { useLocation, Link } from "@remix-run/react";

export default function SideNav({}) {
  const { pathname } = useLocation();
  return (
    <div className="w-52 h-screen shrink-0 mr-6 py-8 text-sm">
      <Link
        to="/"
        className={`pl-8 flex items-center py-2 rounded-r-full ${pathname === "/" ? "bg-primary/20 text-primary" : "hover:bg-gray-200/75"}`}
      >
        <PhotoIcon className="size-6 mr-4" />
        Your albums
      </Link>
      <Link
        to="/sharing"
        className={`pl-8 flex items-center py-2 rounded-r-full ${pathname === "/sharing" ? "bg-primary/20 text-primary" : "hover:bg-gray-200/75"}`}
      >
        <UserGroupIcon className="size-6 mr-4" />
        Shared albums
      </Link>
    </div>
  );
}
