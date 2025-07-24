import React from "react";
import { Sawarabi_Mincho } from "next/font/google";
import Dialog from "./Dialog";
import { DarkModeSwitch } from "../app/Sidebar";

const sawarabi = Sawarabi_Mincho({
	weight: "400",
	subsets: ["latin"],
});

const settingItems = [
	<>
		<label className="block text-sm text-neutral-600 dark:text-neutral-300 mb-2">
			Username
		</label>
		<input
			className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-4 py-3 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400 transition"
			placeholder="Your name"
		/>
	</>,
	<>
		<label
			htmlFor="api"
			className="block text-sm text-neutral-600 dark:text-neutral-300 mb-2"
		>
			API Key
		</label>
		<input
			id="api"
			className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-4 py-3 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400 transition"
			placeholder="Your API Key"
		/>
	</>,
	<>
		<label
			htmlFor="base-url"
			className="block text-sm text-neutral-600 dark:text-neutral-300 mb-2"
		>
			Base URL
		</label>
		<input
			id="base-url"
			className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-4 py-3 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400 transition"
			placeholder="Your Base URL"
		/>
	</>,
	<>
		<label className="block text-sm text-neutral-600 dark:text-neutral-300 mb-2">
			Language
		</label>
		<select className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-4 py-3 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400 transition">
			<option>English</option>
			<option>日本語</option>
		</select>
	</>,
	<>
		<label className="block text-sm text-neutral-600 dark:text-neutral-300 mb-2">
			Notifications
		</label>
		<div className="flex items-center gap-3">
			<input
				type="checkbox"
				className="accent-neutral-700 dark:accent-neutral-200 h-4 w-4"
			/>
			<span className="text-neutral-700 dark:text-neutral-200">
				Enable notifications
			</span>
		</div>
	</>,
	<>
		<label className="block text-sm text-neutral-600 dark:text-neutral-300 mb-2">
			Theme
		</label>
		<div className="text-neutral-700 dark:text-neutral-200">
			<DarkModeSwitch />
		</div>
	</>,
];

interface SettingsDialogProps {
	open: boolean;
	onClose: () => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({ open, onClose }) => {
	return (
		<Dialog open={open} onClose={onClose} variant="fullscreen">
			{/* Header */}
			<div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
				<h2
					className={`${sawarabi.className} text-2xl text-neutral-800 dark:text-neutral-100 tracking-wide`}
				>
					Settings
				</h2>
			</div>
			<div className="flex-1 overflow-y-auto p-6">
				<div className="max-w-2xl mx-auto">
					<form className="flex flex-col gap-4">
						{settingItems.map((item, index) => (
							<React.Fragment key={index}>{item}</React.Fragment>
						))}
					</form>
				</div>
			</div>
		</Dialog>
	);
};

export default SettingsDialog;
