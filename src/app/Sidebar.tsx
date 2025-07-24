"use client";

import { usePathname } from "next/navigation";
import { Sawarabi_Mincho } from "next/font/google";
import React from "react";
import { Moon, Sun, X, Check, Plus } from "lucide-react";
import { useTheme } from "next-themes";
import { Tooltip } from "@lobehub/ui";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { div } from "framer-motion/client";
import { useUserGroups, useLatestGroupMessages } from "../hooks/useDatabase";
import type { Group } from "../lib/database";
import GroupListItem from "../components/GroupListItem";

const sawarabi = Sawarabi_Mincho({
	weight: "400",
	subsets: ["latin"],
});

export default function Sidebar() {
	const pathname = usePathname();
	const router = useRouter();
	const match = pathname.match(/\/group\/(.+)/);
	const groupId = match ? match[1] : undefined;
	const [settingsOpen, setSettingsOpen] = React.useState(false);
	const { groups, loading, error } = useUserGroups();

	const groupIds = groups.map((g) => g.id);
	const latestMessages = useLatestGroupMessages(groupIds);

	return (
		<>
			<aside
				className="w-56 sm:w-72 h-screen fixed left-0 top-0 z-20 px-4 py-8 flex flex-col gap-2 justify-between overflow-hidden border-none select-none"
				style={{ WebkitOverflowScrolling: "auto" }}
			>
				<nav className="flex flex-col gap-1">
					{loading ? (
						<div className="px-3 py-2 text-neutral-500 dark:text-neutral-400 text-sm">
							Loading groups...
						</div>
					) : error ? (
						<div className="px-3 py-2 text-red-500 text-sm">
							Failed to load groups
						</div>
					) : groups.length === 0 ? (
						<div className="px-3 py-2 text-neutral-500 dark:text-neutral-400 text-sm">
							No groups found
						</div>
					) : (
						groups.map((group) => {
							const msg = latestMessages[group.id];
							let preview = "";
							if (msg) {
								const sender =
									msg.senderUser?.name ||
									msg.senderAgent?.name ||
									"Unknown";
								preview = `${sender}: ${msg.content}`;
							}
							return (
								<GroupListItem
									key={group.id}
									group={group}
									selected={groupId === group.id}
									messagePreview={preview}
								/>
							);
						})
					)}
					{/* Add Group Button */}
					<button
						type="button"
						className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg text-neutral-700 dark:text-neutral-200 bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-md font-medium focus:outline-none"
						// No real logic for now
					>
						<Plus size={16} />
						<span>Create new group</span>
					</button>
				</nav>
				<div className="mt-8 px-6 text-center select-none flex items-center justify-between gap-2">
					<div
						onClick={() => {
							setSettingsOpen(true);
						}}
						className={`${sawarabi.className} text-xl text-neutral-700 dark:text-neutral-200 tracking-wide cursor-pointer transition-opacity hover:opacity-70`}
					>
						NakaChat
					</div>
					<DarkModeSwitch />
				</div>
			</aside>
			<AnimatePresence>
				{settingsOpen && (
					<SettingsDialog onClose={() => setSettingsOpen(false)} />
				)}
			</AnimatePresence>
		</>
	);
}

function DarkModeSwitch() {
	const { setTheme, theme } = useTheme();

	return (
		<button
			onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
			aria-label="Toggle dark mode"
			className="ml-2 p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
			type="button"
		>
			{theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
		</button>
	);
}

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
function SettingsDialog({ onClose }: { onClose: () => void }) {
	React.useEffect(() => {
		const onEsc = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("keydown", onEsc);
		return () => document.removeEventListener("keydown", onEsc);
	}, [onClose]);

	return (
		<motion.div
			className="fixed inset-0 z-50 bg-white dark:bg-neutral-900 flex flex-col"
			initial={{ x: "100%" }}
			animate={{ x: 0 }}
			exit={{ x: "100%" }}
			transition={{
				type: "tween",
				ease: [0.25, 0.1, 0.25, 1],
				duration: 0.3,
			}}
		>
			{/* Header */}
			<motion.div
				className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.1, duration: 0.3 }}
			>
				<h2
					className={`${sawarabi.className} text-2xl text-neutral-800 dark:text-neutral-100 tracking-wide`}
				>
					Settings
				</h2>
				<button
					className="p-2 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
					onClick={onClose}
					aria-label="Close settings"
					type="button"
				>
					<X size={24} />
				</button>
			</motion.div>

			<div className="flex-1 overflow-y-auto p-6">
				<div className="max-w-2xl mx-auto">
					<form className="flex flex-col gap-4">
						{settingItems.map((item, index) => (
							<React.Fragment key={index}>{item}</React.Fragment>
						))}
					</form>
				</div>
			</div>
		</motion.div>
	);
}
