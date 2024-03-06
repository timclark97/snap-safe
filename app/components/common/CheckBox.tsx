import { DetailedHTMLProps, InputHTMLAttributes } from "react";

export default function CheckBox({
  name,
  label,
  description
}: { name: string; label: string; description?: string } & DetailedHTMLProps<
  InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
>) {
  return (
    <div className="relative flex items-start">
      <div className="flex h-6 items-center">
        <input
          id={name}
          aria-describedby={`${name}-description`}
          name={name}
          type="checkbox"
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
        />
      </div>
      <div className="ml-3 text-sm leading-6">
        <label htmlFor={name} className="font-medium text-gray-900">
          {label}
        </label>
        {description && (
          <span id={`${name}-description`} className="text-gray-500">
            {" "}
            <span className="sr-only">{label}</span>
            {description}
          </span>
        )}
      </div>
    </div>
  );
}
