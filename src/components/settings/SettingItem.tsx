import { PropsWithChildren } from "react";

interface SettingItemProps {
	type: string;
	label: string;
	id?: string;
	placeholder?: string;
	options?: string[];
}

export default function SettingItem<T extends SettingItemProps>({
	type,
	label,
	id,
	placeholder,
	options,
	children,
}: PropsWithChildren<T>) {
	switch (type) {
		case "input":
			return (
				<div>
					<label
						htmlFor={id}
						className="block text-sm text-neutral-600 dark:text-neutral-300 mb-2"
					>
						{label}
					</label>
					<input
						id={id}
						className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-4 py-3 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400 transition"
						placeholder={placeholder}
					/>
				</div>
			);
		case "select":
			return (
				<div>
					<label
						htmlFor={id}
						className="block text-sm text-neutral-600 dark:text-neutral-300 mb-2"
					>
						{label}
					</label>
					<select
						id={id}
						className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-4 py-3 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400 transition"
					>
						{options?.map((option) => (
							<option key={option}>{option}</option>
						))}
					</select>
				</div>
			);
		case "checkbox":
			return (
				<div>
					<label
						htmlFor={id}
						className="block text-sm text-neutral-600 dark:text-neutral-300 mb-2"
					>
						{label}
					</label>
					<input
						id={id}
						type="checkbox"
						className="w-4 h-4 rounded-full border border-neutral-300 dark:border-neutral-700 bg-transparent px-4 py-3 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400 transition"
					/>
				</div>
			);
		case "label":
			return (
				<div>
					<label
						htmlFor={id}
						className="block text-sm text-neutral-600 dark:text-neutral-300 mb-2"
					>
						{label}
					</label>
					{children}
				</div>
			);
		default:
			return children;
	}
}
