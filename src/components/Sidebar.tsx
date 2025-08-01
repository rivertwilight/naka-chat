"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sawarabi_Mincho } from "next/font/google";
import { Moon, Sun, Plus, Settings, Menu, X } from "lucide-react";
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

// Skeleton component for group list loading
function GroupListSkeleton() {
	return (
		<div className="flex flex-col gap-1">
			{Array.from({ length: 5 }).map((_, index) => (
				<div
					key={index}
					className="px-3 py-2 rounded-lg flex items-center justify-between"
				>
					<div className="flex flex-col flex-1 min-w-0 gap-1">
						<div className="flex items-center justify-between w-full">
							<div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse w-24"></div>
							<div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse w-8"></div>
						</div>
						<div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse w-32"></div>
					</div>
				</div>
			))}
		</div>
	);
}

const sawarabi = Sawarabi_Mincho({
	weight: "400",
	subsets: ["latin"],
});

export default function Sidebar() {
	const pathname = usePathname();
	const match = pathname.match(/\/group\/(.+)/);
	const groupId = match ? match[1] : undefined;
	const {
		isSettingsPanelOpen,
		openSettingsPanel,
		closeSettingsPanel,
		settingsInitialTab,
		isSidebarOpen,
		closeSidebar,
		toggleSidebar,
	} = useUiContext();
	const [groupsVersion, setGroupsVersion] = useState(0); // Add version state
	const { groups, loading, error } = useUserGroups(groupsVersion);
	const { user } = useCurrentUser();
	const router = useRouter();
	const [creating, setCreating] = useState(false);

	// Close sidebar when clicking outside on mobile
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (isSidebarOpen && window.innerWidth < 768) {
				const sidebar = document.getElementById('mobile-sidebar');
				if (sidebar && !sidebar.contains(event.target as Node)) {
					closeSidebar();
				}
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [isSidebarOpen, closeSidebar]);

	// Close sidebar on route change on mobile
	useEffect(() => {
		if (window.innerWidth < 768) {
			closeSidebar();
		}
	}, [pathname, closeSidebar]);

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
			{/* Mobile Hamburger Button */}
			<button
				onClick={toggleSidebar}
				className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 shadow-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
				aria-label="Toggle sidebar"
			>
				{isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
			</button>

			{/* Mobile Overlay */}
			{isSidebarOpen && (
				<div
					className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
					onClick={closeSidebar}
				/>
			)}

			{/* Sidebar */}
			<aside
				id="mobile-sidebar"
				className={`
					w-72 sm:w-80 h-screen fixed left-0 top-0 z-40 py-8 flex flex-col gap-2 justify-between overflow-hidden border-none select-none bg-neutral-100 dark:bg-neutral-800
					transition-transform duration-300 ease-in-out
					md:translate-x-0 md:z-20
					${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
				`}
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
							onClick={() => openSettingsPanel()}
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
						<GroupListSkeleton />
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
								const sender = msg.sender?.name || "Unknown";
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
				<div className="px-4">
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
				initialTab={settingsInitialTab}
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
