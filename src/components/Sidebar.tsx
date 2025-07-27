"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sawarabi_Mincho } from "next/font/google";
import { Moon, Sun, Plus, Settings } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import {
	useUserGroups,
	useLatestGroupMessages,
	useCurrentUser,
} from "@/hooks/useDatabase";
import GroupListItem from "@/components/GroupListItem";
import SettingsDialog from "@/components/SettingsDialog";
import { useUiContext } from "@/components/UiContext";
import { dbHelpers } from "@/lib/database";
import { format } from "date-fns";

function formatMessageTime(date: Date | undefined): string {
	if (!date) return "";
	const now = new Date();
	const isToday =
		date.getDate() === now.getDate() &&
		date.getMonth() === now.getMonth() &&
		date.getFullYear() === now.getFullYear();
	return isToday ? format(date, "HH:mm") : format(date, "MM/dd");
}

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
	const { groups, loading, error } = useUserGroups(groupsVersion);
	const { user } = useCurrentUser();
	const router = useRouter();
	const [creating, setCreating] = useState(false);

	const handleCreateGroup = async () => {
		if (!user) return;
		setCreating(true);
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
			console.error(e);
		} finally {
			setCreating(false);
		}
	};

	const handleRemoveGroup = async (groupIdToRemove: string) => {
		console.log("handleRemoveGroup called with:", groupIdToRemove);
		try {
			// If we're currently viewing the group being deleted, navigate to home
			if (groupIdToRemove === groupId) {
				router.push("/");
			}

			// Delete the group from database
			await dbHelpers.deleteGroup(groupIdToRemove);

			// Trigger refetch of groups
			setGroupsVersion((v) => v + 1);
		} catch (e) {
			console.error("Failed to remove group:", e);
		}
	};

	const groupIds = groups.map((g) => g.id);
	const latestMessages = useLatestGroupMessages(groupIds);

	return (
		<>
			<aside
				className="w-56 sm:w-72 h-screen fixed left-0 top-0 z-20 py-8 flex flex-col gap-2 justify-between overflow-hidden border-none select-none bg-neutral-100 dark:bg-neutral-800"
				style={{ WebkitOverflowScrolling: "auto" }}
			>
				<div className="mb-4 px-6 text-center select-none flex items-center justify-between gap-2">
					<div
						onClick={() => router.push("/")}
						className={`${sawarabi.className} text-xl text-neutral-700 dark:text-neutral-200 tracking-wide cursor-pointer transition-opacity hover:opacity-70`}
					>
						NakaChat
					</div>
					<div className="flex items-center gap-2">
						<button
							onClick={openSettingsPanel}
							aria-label="Open settings"
							className="p-2 rounded-full text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
							type="button"
						>
							<Settings size={16} />
						</button>
						<DarkModeSwitch />
					</div>
				</div>

				{/* Group List - scrollable */}
				<nav className="flex flex-col gap-1 flex-1 min-h-0 overflow-y-auto px-4">
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
						groups.map((group, index) => {
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
									lastMessageTime={formatMessageTime(
										msg?.created_at
									)}
									onGroupDeleted={() => {
										// Refresh the groups list after deletion
										setGroupsVersion((prev) => prev + 1);
									}}
									onGroupRenamed={() => {
										// Refresh the groups list after renaming
										setGroupsVersion((prev) => prev + 1);
									}}
								/>
							);
						})
					)}
				</nav>

				{/* Add Group Button - Fixed at bottom */}
				<div className="px-4 pb-4">
					<button
						type="button"
						className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-neutral-700 dark:text-neutral-200 bg-transparent hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors text-md font-medium focus:outline-none disabled:opacity-60"
						onClick={handleCreateGroup}
						disabled={creating}
					>
						<Plus size={16} />
						<span>
							{creating ? "Creating..." : "Create new group"}
						</span>
					</button>
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
	const { setTheme, theme, resolvedTheme } = useTheme();
	const [isClient, setIsClient] = useState(false);

	useEffect(() => {
		setIsClient(true);
	}, []);

	// Use resolvedTheme to get the actual theme (system preference resolved)
	const currentTheme = resolvedTheme || theme;

	return isClient ? (
		<button
			id="dark-mode-switch"
			onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
			aria-label="Toggle dark mode"
			className="p-2 text-neutral-700 dark:text-neutral-200 rounded-full z-50 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
			type="button"
		>
			{currentTheme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
		</button>
	) : (
		<button
			onClick={() => setTheme("light")}
			aria-label="Toggle dark mode"
			className="p-2 text-neutral-700 dark:text-neutral-200 rounded-full z-50 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
			type="button"
		>
			<Sun size={16} />
		</button>
	);
}
