import { DetailedHTMLProps, SelectHTMLAttributes } from "react";

export default function Select({
  label,
  name,
  values,
  defaultValue
}: {
  name: string;
  label: string;
  values: string[] | Record<string, string>;
  defaultValue?: string;
} & DetailedHTMLProps<
  SelectHTMLAttributes<HTMLSelectElement>,
  HTMLSelectElement
>) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-medium leading-6 text-gray-900"
      >
        {label}
      </label>
      <select
        id={name}
        name={name}
        className="mt-2 block w-full rounded-md border-0 py-2.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
        defaultValue={defaultValue}
      >
        {(Array.isArray(values) ? values : Object.keys(values)).map((value) => (
          <option
            key={value}
            value={Array.isArray(values) ? value : values[value]}
          >
            {value}
          </option>
        ))}
      </select>
    </div>
  );
}
