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
					<div className="relative">
						<select
							id={id}
							className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent appearance-none px-4 py-3 pr-10 text-neutral-900 dark:text-neutral-100 focus:outline-none select-none focus:ring-2 focus:ring-neutral-400 dark:focus:border-neutral-600 transition"
						>
							{options?.map((option) => (
								<option key={option}>{option}</option>
							))}
						</select>
						<div className="pointer-events-none absolute inset-y-0 right-2 flex items-center px-2 text-neutral-500">
							<svg
								className="fill-current h-4 w-4"
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 20 20"
							>
								<path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
							</svg>
						</div>
					</div>
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
