"use client";

import React from "react";
import { Avatar } from "@lobehub/ui";
import { MessageWithDetails } from "@/lib/database";
import { formatTimestamp } from "@/utils/dateUtils";

interface SystemMessageBlockProps {
	type: "dm_to_current_user" | "dm_between_users" | "event";
	message: MessageWithDetails;
	onEnterDM?: (
		senderId: string,
		senderName: string,
		senderAvatar: string
	) => void;
}

const SystemMessageBlock: React.FC<SystemMessageBlockProps> = ({
	type,
	message,
	onEnterDM,
}) => {
	// DM to current user
	if (type === "dm_to_current_user") {
		return (
			<div
				className="flex items-center gap-2 mx-auto my-4 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full border border-neutral-300 dark:border-neutral-700 px-4 py-2 transition-colors"
				onClick={() => {
					const senderId = message.sender?.id as string;
					if (senderId && onEnterDM) {
						onEnterDM(
							senderId,
							message.sender?.name as string,
							message.sender?.avatar_url as string
						);
					}
				}}
			>
				<Avatar src={message.sender?.avatar_url} size={24} />
				<span className="text-sm text-neutral-500 dark:text-neutral-400">
					{message.sender?.name}
				</span>
				<span className="text-sm text-orange-500 dark:text-orange-400 mx-2">
					Send you a DM
				</span>
				<span className="text-xs text-neutral-400 dark:text-neutral-500">
					{formatTimestamp(message.created_at)}
				</span>
			</div>
		);
	}

	if (type === "event") {
		return (
			<div className="flex items-center gap-2 mx-auto my-4 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full border border-neutral-300 dark:border-neutral-700 px-4 py-2">
				Event message
			</div>
		);
	}

	// DM to other user, can be from current user or from other user
	return (
		<div className="flex items-center gap-2 mx-auto my-4 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full border border-neutral-300 dark:border-neutral-700 px-4 py-2">
			<Avatar src={message.sender?.avatar_url} size={24} />
			<span className="text-sm text-neutral-500 dark:text-neutral-400">
				{message.sender?.name}
			</span>
			<span className="text-sm text-neutral-500 dark:text-neutral-400 mx-2 italic">
				Send a DM to {message.recipient?.name || "Unknown"}
			</span>
			<span className="text-xs text-neutral-400 dark:text-neutral-500">
				{formatTimestamp(message.created_at)}
			</span>
		</div>
	);
};

export default SystemMessageBlock;
