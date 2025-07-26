import Link from "next/link";
import React from "react";
import { Check, Pin, X } from "lucide-react";
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
}

const GroupListItem: React.FC<GroupListItemProps> = ({
	group,
	selected,
	messagePreview,
	lastMessageTime,
	onGroupDeleted,
}) => {
	const [showCheck, setShowCheck] = React.useState(false);
	const { deleteGroup, pinGroup } = useGroupOperations();
	const router = useRouter();

	const handleMenuClick = async (key: string) => {
		try {
			switch (key) {
				case "pin":
					await pinGroup(group.id);
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

	const menu: DropdownProps["menu"] = {
		items: [
			{
				label: "Pin",
				key: "pin",
				icon: <Pin size={16} />,
				onClick: () => handleMenuClick("pin"),
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
		<Link
			href={`/group/${group.id}`}
			className={
				`group text-left px-3 py-2 rounded-lg bg-transparent transition-colors text-neutral-800 dark:text-neutral-200 focus:outline-none hover:bg-neutral-50 dark:hover:bg-neutral-900 flex items-center justify-between` +
				(selected ? " font-semibold bg-white dark:bg-neutral-900" : "")
			}
		>
			<Dropdown menu={menu} trigger={["contextMenu"]}>
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
				{/* <span
				className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex items-center"
				onClick={(e) => {
					e.preventDefault();
					setShowCheck((v) => !v);
				}}
			>
				{showCheck ? (
					<button
						type="button"
						tabIndex={-1}
						className="outline-none bg-transparent border-none p-0 m-0 cursor-pointer"
						onBlur={() => setShowCheck(false)}
					>
						<Check size={16} />
					</button>
				) : (
					<Tooltip title="Remove group" placement="top">
						<button
							type="button"
							tabIndex={-1}
							className="outline-none bg-transparent border-none p-0 m-0 cursor-pointer"
							onBlur={() => setShowCheck(false)}
						>
							<X size={16} />
						</button>
					</Tooltip>
				)}
			</span> */}
			</Dropdown>
		</Link>
	);
};

export default GroupListItem;
