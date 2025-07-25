"use client";

import { usePathname } from "next/navigation";
import { Sawarabi_Mincho } from "next/font/google";
import React from "react";
import { Moon, Sun, X, Check, Plus } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import {
	useUserGroups,
	useLatestGroupMessages,
	useCurrentUser,
} from "../hooks/useDatabase";
import GroupListItem from "../components/GroupListItem";
import SettingsDialog from "../components/SettingsDialog";
import { useUiContext } from "../components/UiContext";
import { useState } from "react";
import { dbHelpers } from "../lib/database";

const sawarabi = Sawarabi_Mincho({
	weight: "400",
	subsets: ["latin"],
});

export default function Sidebar() {
	const pathname = usePathname();
	const match = pathname.match(/\/group\/(.+)/);
	const groupId = match ? match[1] : undefined;
	const { isSettingsPanelOpen, openSettingsPanel, closeSettingsPanel } =
		useUiContext();
	const [groupsVersion, setGroupsVersion] = useState(0); // Add version state
	const { groups, loading, error } = useUserGroups(groupsVersion); // Pass version
	const { user } = useCurrentUser();
	const router = useRouter();
	const [creating, setCreating] = useState(false);
	const [errorMsg, setErrorMsg] = useState("");
	const [groupName, setGroupName] = useState("");
	const [groupDesc, setGroupDesc] = useState("");

	const handleCreateGroup = async () => {
		if (!user) return;
		setCreating(true);
		setErrorMsg("");
		try {
			const group = await dbHelpers.createGroup({
				name: "Untitled",
				description: "",
				created_by: user.id,
			});
			await dbHelpers.addGroupMember({
				group_id: group.id,
				user_id: user.id,
				role: "human",
				status: "active",
			});
			setGroupsVersion((v) => v + 1); // Trigger refetch
			setTimeout(() => router.push(`/group/${group.id}`), 100);
		} catch (e) {
			setErrorMsg("Failed to create group");
		} finally {
			setCreating(false);
		}
	};

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
						className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg text-neutral-700 dark:text-neutral-200 bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-md font-medium focus:outline-none disabled:opacity-60"
						onClick={handleCreateGroup}
						disabled={creating}
					>
						<Plus size={16} />
						<span>
							{creating ? "Creating..." : "Create new group"}
						</span>
					</button>
					{errorMsg && (
						<div className="text-red-500 text-sm mt-2">
							{errorMsg}
						</div>
					)}
				</nav>
				<div className="mt-8 px-6 text-center select-none flex items-center justify-between gap-2">
					<div
						onClick={openSettingsPanel}
						className={`${sawarabi.className} text-xl text-neutral-700 dark:text-neutral-200 tracking-wide cursor-pointer transition-opacity hover:opacity-70`}
					>
						NakaChat
					</div>
					<DarkModeSwitch />
				</div>
			</aside>
			<SettingsDialog
				open={isSettingsPanelOpen}
				onClose={closeSettingsPanel}
			/>
		</>
	);
}

export function DarkModeSwitch() {
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
