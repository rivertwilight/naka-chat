"use client";

import React from "react";
import { Avatar } from "@lobehub/ui";
import PublicMessageBlock from "@/components/PublicMessageBlock";

interface MessageItemProps {
	messageId: string;
	sender: string;
	time: string;
	content: string;
	geistMono: { className: string };
	idx: number;
	reactions?: { emoji: string; count: number }[];
	onReact?: (emoji: string) => void;
	avatar_url?: string;
	created_at: Date;
	type?: string;
	dm_target?: any;
	senderUser?: any;
	senderAgent?: any;
	currentUserId?: string;
	onDmClick?: (
		senderId: string,
		senderName: string,
		senderAvatar?: string
	) => void;
}

const MessageItem: React.FC<MessageItemProps> = ({
	messageId,
	sender,
	time,
	content,
	geistMono,
	idx,
	reactions = [],
	onReact,
	avatar_url,
	created_at,
	type,
	dm_target,
	senderUser,
	senderAgent,
	currentUserId,
	onDmClick,
}) => {
	// DM-specific rendering
	const isDM = type === "dm";
	const isDmByCurrentUser = isDM && senderUser?.id === currentUserId;
	const isDmToCurrentUser =
		isDM && dm_target && dm_target.id === currentUserId;

	// DM to current user
	if (isDmToCurrentUser) {
		return (
			<div
				className="flex items-center gap-2 mx-auto my-4 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full border border-neutral-300 dark:border-neutral-700 px-4 py-2 transition-colors"
				onClick={() => {
					const senderId = senderUser?.id || senderAgent?.id;
					if (senderId && onDmClick) {
						onDmClick(senderId, sender, avatar_url);
					}
				}}
			>
				<Avatar src={avatar_url} size={24} />
				<span className="text-sm text-neutral-500 dark:text-neutral-400">
					{sender}
				</span>
				<span className="text-sm text-orange-500 dark:text-orange-400 mx-2">
					Send you a DM
				</span>
				<span className="text-xs text-neutral-400 dark:text-neutral-500">
					{time}
				</span>
			</div>
		);
	}

	// DM to other user
	if (!isDmToCurrentUser && isDM) {
		return (
			<div className="flex items-center gap-2 mx-auto my-4 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full border border-neutral-300 dark:border-neutral-700 px-4 py-2">
				<Avatar src={avatar_url} size={24} />
				<span className="text-sm text-neutral-500 dark:text-neutral-400">
					{sender}
				</span>
				<span className="text-sm text-neutral-500 dark:text-neutral-400 mx-2 italic">
					Send a DM to {dm_target?.name || "Unknown"}
				</span>
				<span className="text-xs text-neutral-400 dark:text-neutral-500">
					{time}
				</span>
			</div>
		);
	}

	// Public message - use PublicMessageBlock
	return (
		<PublicMessageBlock
			messageId={messageId}
			sender={sender}
			time={time}
			content={content}
			geistMono={geistMono}
			idx={idx}
			reactions={reactions}
			onReact={onReact}
			avatar_url={avatar_url}
			created_at={created_at}
			senderUser={senderUser}
			senderAgent={senderAgent}
			currentUserId={currentUserId}
		/>
	);
};

export default MessageItem;
