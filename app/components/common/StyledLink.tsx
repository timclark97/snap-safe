import { LinkProps, Link } from "@remix-run/react";

export default function StyledLink({
  children,
  ...props
}: {
  children: React.ReactNode;
} & LinkProps) {
  return (
    <Link
      className="font-semibold text-indigo-600 hover:text-indigo-500"
      {...props}
    >
      {children}
    </Link>
  );
}
