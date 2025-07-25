import Link from "next/link";
import React from "react";
import { Check, X } from "lucide-react";
import { Tooltip } from "@lobehub/ui";
import type { Group } from "../lib/database";

interface GroupListItemProps {
	group: Group;
	selected: boolean;
	messagePreview?: string;
}

const GroupListItem: React.FC<GroupListItemProps> = ({
	group,
	selected,
	messagePreview,
}) => {
	const [showCheck, setShowCheck] = React.useState(false);
	return (
		<Link
			href={`/group/${group.id}`}
			className={
				`group text-left px-3 py-2 rounded-lg bg-transparent transition-colors text-neutral-800 dark:text-neutral-200 focus:outline-none hover:bg-neutral-50 dark:hover:bg-neutral-900 flex items-center justify-between` +
				(selected
					? " font-semibold bg-white dark:bg-neutral-900"
					: "")
			}
		>
			<div className="flex flex-col flex-1 min-w-0">
				<span className="truncate">{group.name}</span>
				{messagePreview && (
					<span className="truncate text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
						{messagePreview}
					</span>
				)}
			</div>
			<span
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
			</span>
		</Link>
	);
};

export default GroupListItem;
