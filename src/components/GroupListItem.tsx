import Link from "next/link";
import React from "react";
import { Check, Pin, X } from "lucide-react";
import { Dropdown, DropdownProps, Tooltip } from "@lobehub/ui";
import { useRouter } from "next/navigation";
import type { Group } from "../lib/database";

interface GroupListItemProps {
	group: Group;
	selected: boolean;
	messagePreview?: string;
	lastMessageTime?: string; // new prop
	onRemoveGroup?: (groupId: string) => void;
}

const GroupListItem: React.FC<GroupListItemProps> = ({
	group,
	selected,
	messagePreview,
	lastMessageTime,
	onRemoveGroup,
}) => {
	const [showCheck, setShowCheck] = React.useState(false);
	const router = useRouter();
	
	const menu: DropdownProps["menu"] = {
		items: [
			{
				label: "Pin",
				key: "pin",
				icon: <Pin size={16} />,
			},
			{
				label: "Remove group",
				key: "remove",
				icon: <X size={16} />,
				onClick: () => {
					console.log("Remove group clicked for:", group.id);
					if (onRemoveGroup) {
						onRemoveGroup(group.id);
					}
				},
			},
		],
	};

	const handleClick = (e: React.MouseEvent) => {
		e.preventDefault();
		router.push(`/group/${group.id}`);
	};

	return (
		<div
			className={
				`group text-left px-3 py-2 rounded-lg bg-transparent transition-colors text-neutral-800 dark:text-neutral-200 focus:outline-none hover:bg-neutral-50 dark:hover:bg-neutral-900 flex items-center justify-between cursor-pointer` +
				(selected ? " font-semibold bg-white dark:bg-neutral-900" : "")
			}
			onClick={handleClick}
		>
			<Dropdown 
				menu={menu} 
				trigger={["contextMenu"]} 
				onOpenChange={(open) => {}}
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
			</Dropdown>
		</div>
	);
};

export default GroupListItem;
