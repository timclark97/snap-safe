import { Link } from "@remix-run/react";
import type { LinkProps } from "@remix-run/react";

import { colors, sizes } from "./Button";

export default function Button({
  children,
  color = "primary",
  size = "base",
  className,
  ...props
}: {
  children: React.ReactNode;
  color?: keyof typeof colors;
  size?: keyof typeof sizes;
} & LinkProps) {
  const styles = `${colors[color]} ${sizes[size]} flex justify-center items-center rounded-md text-sm font-semibold relative disabled:cursor-not-allowed ${className}`;

  return (
    <Link className={styles} {...props}>
      {children}
    </Link>
  );
}
