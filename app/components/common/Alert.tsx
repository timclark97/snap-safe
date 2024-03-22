import { useState } from "react";
import {
  ExclamationTriangleIcon,
  XCircleIcon,
  CheckCircleIcon,
  XMarkIcon
} from "@heroicons/react/20/solid";
import { useRevalidator } from "@remix-run/react";

const variants = {
  error: {
    defaultHeader: "Something went wrong",
    bg: "bg-red-50 border border-red-100",
    icon: XCircleIcon,
    iconColor: "text-red-500",
    text: "text-red-700"
  },
  warning: {
    defaultHeader: "Something went wrong",
    bg: "bg-yellow-50 border border-yellow-100",
    icon: ExclamationTriangleIcon,
    iconColor: "text-yellow-500",
    text: "text-yellow-800"
  },
  success: {
    defaultHeader: "Success",
    bg: "bg-green-50 border border-green-100",
    icon: CheckCircleIcon,
    iconColor: "text-green-400",
    text: "text-green-800"
  }
};

export default function Alert({
  variant = "success",
  header,
  dismissible = false,
  revalidateable,
  children
}: {
  variant?: keyof typeof variants;
  header?: string;
  dismissible?: boolean;
  revalidateable?: boolean;
  children: React.ReactNode;
}) {
  const revalidator = useRevalidator();
  const [isOpen, setIsOpen] = useState(true);
  const { bg, icon: Icon, iconColor, text, defaultHeader } = variants[variant];

  if (!children || !isOpen) {
    return null;
  }
  return (
    <div className={`${bg} relative rounded-md p-4`}>
      {dismissible && (
        <div className="absolute right-0 top-0 p-2">
          <button onClick={() => setIsOpen(false)}>
            <XMarkIcon className={`w-6 ${iconColor}`} />
          </button>
        </div>
      )}
      <div className="flex">
        <div className="flex-shrink-0">
          <Icon className={`h-5 w-5 ${iconColor}`} aria-hidden="true" />
        </div>
        <div className={`ml-3 ${text}`}>
          <h3 className="text-sm font-medium">{header ?? defaultHeader}</h3>
          <div className="mt-2 text-sm">{children}</div>
          {revalidateable && (
            <button
              className="underline text-sm mt-2"
              onClick={() => revalidator.revalidate()}
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
