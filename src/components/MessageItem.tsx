"use client";

import React from "react";
import { MessageWithDetails } from "@/lib/database";
import SystemMessageBlock from "./SystemMessageBlock";
import MessageBlock from "@/components/ChatMessageBlock";

interface MessageItemProps {
	message: MessageWithDetails;
	currentUserId: string;
	onEnterDM?: (
		senderId: string,
		senderName: string,
		senderAvatar: string
	) => void;
}

const MessageItem: React.FC<MessageItemProps> = ({
	message,
	currentUserId,
	onEnterDM,
}) => {
	const isFromCurrentUser = message.sender?.id === currentUserId;

	const isDM = message.type === "dm";

	const isDmWithCurrentUser = isDM && message.dm_target_id === currentUserId;

	if (isDmWithCurrentUser) {
		return (
			<SystemMessageBlock
				type="dm_to_current_user"
				message={message}
				onEnterDM={onEnterDM}
			/>
		);
	}

	if (!isDmWithCurrentUser && isDM) {
		return (
			<SystemMessageBlock
				type="dm_between_users"
				message={message}
				onEnterDM={onEnterDM}
			/>
		);
	}

	console.log("***", message);

	return (
		<MessageBlock
			message={message}
			side={isFromCurrentUser ? "right" : "left"}
		/>
	);
};

export default MessageItem;
