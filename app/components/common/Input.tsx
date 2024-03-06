import { DetailedHTMLProps, InputHTMLAttributes } from "react";

export default function Input({
  label,
  name,
  description,
  errors,
  ...props
}: {
  label: string;
  name: string;
  description?: string;
  errors?: Record<string, string[]>;
} & DetailedHTMLProps<
  InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
>) {
  const error = errors?.[name];
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-medium leading-6 text-gray-900"
      >
        {label}
      </label>
      <div>
        <input
          type="text"
          name={name}
          id={name}
          className={`block w-full rounded-md border-0 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 ${
            props.disabled ? "pointer-events-none cursor-not-allowed" : ""
          }`}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600" id={`${name}-error`}>
          {error.join(", ")}
        </p>
      )}
      {description && (
        <p className="mt-2 text-sm text-gray-500" id={`${name}-description`}>
          {description}
        </p>
      )}
    </div>
  );
}
