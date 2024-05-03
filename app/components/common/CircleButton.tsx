import type { DetailedHTMLProps, ButtonHTMLAttributes } from "react";

export default function CircleIconButton({
  children,
  ...props
}: { children: React.ReactNode } & DetailedHTMLProps<
  ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
>) {
  return (
    <button
      className="rounded-full flex justify-center items-center hover:bg-gray-200 transition-colors p-2.5"
      {...props}
    >
      {children}
    </button>
  );
}
