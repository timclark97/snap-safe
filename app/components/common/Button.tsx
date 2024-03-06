import { DetailedHTMLProps, ButtonHTMLAttributes } from "react";

export const colors = {
  primary:
    "bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:outline-indigo-600 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
  secondary:
    "bg-white text-gray-900 shadow-sm hover:bg-gray-50 ring-1 ring-inset ring-gray-300",
  soft: "bg-indigo-50 text-indigo-600 hover:bg-indigo-100",
  danger: "bg-red-600 hover:bg-red-500 focus-visible:outline-red-600"
};

export const sizes = {
  sm: "px-2 py-1",
  base: "px-3 py-3"
};

export default function Button({
  children,
  color = "primary",
  size = "base",
  isLoading,
  className,
  ...props
}: {
  children: React.ReactNode;
  color?: keyof typeof colors;
  size?: keyof typeof sizes;
  isLoading?: boolean;
} & DetailedHTMLProps<
  ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
>) {
  const styles = `${colors[color]} ${
    sizes[size]
  } rounded-md text-sm font-semibold relative disabled:cursor-not-allowed ${
    isLoading ? "pointer-events-none" : ""
  } ${className}`;

  return (
    <button
      type="button"
      className={styles}
      {...props}
      aria-disabled={isLoading}
    >
      {isLoading && (
        <div className="absolute left-4 top-0 flex h-full items-center">
          <svg
            className="h-5 w-5 animate-spin text-inherit"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
      )}
      {children}
    </button>
  );
}
