import Link from "next/link";
import React from "react";
import { Check, Pin, Pencil, X, Loader } from "lucide-react";
import { Dropdown, DropdownProps, Tooltip } from "@lobehub/ui";
import type { Group } from "../lib/database";
import { useGroupOperations } from "../hooks/useDatabase";
import { useRouter } from "next/navigation";

interface GroupListItemProps {
	group: Group;
	selected: boolean;
	messagePreview?: string;
	lastMessageTime?: string; // new prop
	onGroupDeleted?: () => void; // callback for when group is deleted
	onGroupRenamed?: () => void; // callback for when group is renamed
}

const GroupListItem: React.FC<GroupListItemProps> = ({
	group,
	selected,
	messagePreview,
	lastMessageTime,
	onGroupDeleted,
	onGroupRenamed,
}) => {
	const [showCheck, setShowCheck] = React.useState(false);
	const [isRenaming, setIsRenaming] = React.useState(false);
	const [isRenamingLoading, setIsRenamingLoading] = React.useState(false);
	const [newName, setNewName] = React.useState(group.name);
	const { deleteGroup, pinGroup, renameGroup } = useGroupOperations();
	const router = useRouter();

	// Update newName when group name changes
	React.useEffect(() => {
		setNewName(group.name);
	}, [group.name]);

	const handleMenuClick = async (key: string) => {
		try {
			switch (key) {
				case "pin":
					await pinGroup(group.id);
					break;
				case "rename":
					setIsRenaming(true);
					setNewName(group.name);
					break;
				case "remove":
					if (
						confirm(
							"Are you sure you want to delete this group? This action cannot be undone."
						)
					) {
						await deleteGroup(group.id);
						onGroupDeleted?.();
						// Redirect to home if this was the selected group
						if (selected) {
							router.push("/");
						}
					}
					break;
			}
		} catch (error) {
			console.error("Error performing group operation:", error);
			alert("An error occurred while performing the operation.");
		}
	};

	const handleRename = async () => {
		const trimmedName = newName.trim();
		if (!trimmedName || trimmedName === group.name) {
			setIsRenaming(false);
			setNewName(group.name);
			return;
		}

		setIsRenamingLoading(true);
		try {
			await renameGroup(group.id, trimmedName);
			onGroupRenamed?.();
			setIsRenaming(false);
		} catch (error) {
			console.error("Error renaming group:", error);
			alert("An error occurred while renaming the group.");
			setNewName(group.name); // Reset to original name on error
		} finally {
			setIsRenamingLoading(false);
		}
	};

	const handleRenameKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			e.preventDefault();
			handleRename();
		} else if (e.key === "Escape") {
			setIsRenaming(false);
			setNewName(group.name);
		}
	};

	const menu: DropdownProps["menu"] = {
		items: [
			{
				label: "Pin",
				key: "pin",
				icon: <Pin size={16} />,
				onClick: () => handleMenuClick("pin"),
			},
			{
				label: "Rename",
				key: "rename",
				icon: <Pencil size={16} />,
				onClick: () => handleMenuClick("rename"),
			},
			{
				label: "Remove group",
				key: "remove",
				icon: <X size={16} />,
				onClick: () => handleMenuClick("remove"),
			},
		],
	};

	return (
		<Dropdown menu={menu} trigger={["contextMenu"]}>
			{isRenaming ? (
				<div className="group text-left px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-700 transition-colors text-neutral-800 dark:text-neutral-200 focus:outline-none flex items-center justify-between">
					<div className="flex flex-col flex-1 min-w-0">
						<div className="flex items-center gap-2 z-1 relative">
							<input
								type="text"
								value={newName}
								onChange={(e) => setNewName(e.target.value)}
								onBlur={handleRename}
								onKeyDown={handleRenameKeyDown}
								className="w-full bg-transparent border-none outline-none text-neutral-800 dark:text-neutral-200 font-semibold"
								autoFocus
								maxLength={40}
								placeholder="Enter group name..."
								disabled={isRenamingLoading}
							/>
							<div className="flex box-border px-4 justify-end items-start max-w-36 absolute -right-6 -top-1">
								{isRenamingLoading ? (
									<Loader
										size={14}
										className="animate-spin text-neutral-400 dark:text-neutral-500"
									/>
								) : (
									<span className="text-xs text-neutral-400 dark:text-neutral-500">
										Press Enter to save, Esc to cancel
									</span>
								)}
							</div>
						</div>
						{messagePreview && (
							<span className="truncate text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
								{messagePreview}
							</span>
						)}
					</div>
				</div>
			) : (
				<Link
					href={`/group/${group.id}`}
					className={
						`group text-left px-3 py-2 rounded-lg bg-transparent transition-colors text-neutral-800 dark:text-neutral-200 focus:outline-none hover:bg-neutral-50 dark:hover:bg-neutral-900 flex items-center justify-between` +
						(selected ? " font-semibold bg-white dark:bg-neutral-900" : "")
					}
				>
					<div className="flex flex-col flex-1 min-w-0">
						<div className="flex items-center justify-between w-full">
							<span className="truncate">{group.name}</span>
							{lastMessageTime && (
								<span className="ml-2 text-xs text-neutral-400 dark:text-neutral-500 whitespace-nowrap">
									{lastMessageTime}
								</span>
							)}
						</div>
						{messagePreview && (
							<span className="truncate text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
								{messagePreview}
							</span>
						)}
					</div>
				</Link>
			)}
		</Dropdown>
	);
};

export default GroupListItem;
