import React, { useState } from "react";
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

const sidebarNav = [
	{ key: "general", label: "General" },
	{ key: "model", label: "Model" },
	{ key: "about", label: "About" },
];

const generalItems = settingItems;
const modelItems = [
	<div className="text-neutral-600 dark:text-neutral-300">
		Model settings coming soon...
	</div>,
];
const aboutItems = [
	<div className="text-neutral-600 dark:text-neutral-300">
		<div className="text-lg mb-2 font-semibold">NakaChat</div>
		<div className="text-sm">
			AI multi-agent chat UI. Inspired by Japanese Kanso and Wabi-sabi
			aesthetics.
		</div>
		<div className="mt-4 text-xs text-neutral-400">Version 1.0.0</div>
	</div>,
];

const tabContent: Record<string, React.ReactNode[]> = {
	general: generalItems,
	model: modelItems,
	about: aboutItems,
};

interface SettingsDialogProps {
	open: boolean;
	onClose: () => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({ open, onClose }) => {
	const [selectedTab, setSelectedTab] = useState("general");
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
			<div className="flex flex-1 min-h-0 h-[calc(100vh-80px)] relative">
				{/* Sidebar Navigation */}
				<nav className="absolute left-0 top-0 w-56 sm:w-72 py-8 px-4 flex flex-col gap-2 bg-white dark:bg-neutral-900 select-none">
					{sidebarNav.map((item) => (
						<button
							key={item.key}
							onClick={() => setSelectedTab(item.key)}
							className={`text-left rounded-lg px-3 py-2 text-md font-medium transition-colors ${
								sawarabi.className
							} text-neutral-700 dark:text-neutral-200 tracking-wide hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:outline-none ${
								selectedTab === item.key
									? "bg-neutral-100 dark:bg-neutral-800 font-semibold"
									: "bg-transparent"
							}`}
							type="button"
						>
							{item.label}
						</button>
					))}
				</nav>
				{/* Main Content */}
				<div className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
					<div className="w-full max-w-2xl mx-auto">
						<form className="flex flex-col gap-4">
							{tabContent[selectedTab].map((item, index) => (
								<React.Fragment key={index}>
									{item}
								</React.Fragment>
							))}
						</form>
					</div>
				</div>
			</div>
		</Dialog>
	);
};

export default SettingsDialog;
