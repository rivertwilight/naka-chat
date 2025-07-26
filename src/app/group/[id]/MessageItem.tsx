"use client";

import React, { useState } from "react";
import { Avatar, Dropdown, Markdown, Tooltip } from "@lobehub/ui";

import { type DropdownProps, Icon } from "@lobehub/ui";
import {
	AtSign,
	Settings,
	Copy,
	Reply,
	Smile,
	Trash,
	MoreHorizontal,
	Flag,
	MessageCircle,
} from "lucide-react";

export const menu: DropdownProps["menu"] = {
	items: [
		{
			icon: <Icon icon={AtSign} />,
			key: "copy",
			label: "Mention",
		},
		{
			icon: <Icon icon={MessageCircle} />,
			key: "dm",
			label: "Direct Message",
		},
		{
			icon: <Icon icon={Settings} />,
			key: "selectAll",
			label: "Customize",
		},
	],
};

export const messageMenu: DropdownProps["menu"] = {
	items: [
		{
			icon: <Icon icon={Trash} />,
			key: "delete",
			label: "Delete",
		},
		{
			icon: <Icon icon={Flag} />,
			key: "report",
			label: "Report",
		},
	],
};

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
	onDmClick?: (senderId: string, senderName: string, senderAvatar?: string) => void;
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
	const isHuman = sender === "You";
	const [showEmojis, setShowEmojis] = useState(false);
	const [copied, setCopied] = useState(false);

	// Calculate opacity: messages older than 1 hour use minOpacity, else full opacity
	const now = Date.now();
	const msgTime = new Date(created_at).getTime();
	const oneHour = 1000 * 60 * 60;
	const minOpacity = 0.75;
	const opacity = now - msgTime >= oneHour ? minOpacity : 1;

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

	return (
		<div
			className={`flex flex-col gap-4 py-2 mt-2 ${
				isHuman ? "items-end" : "items-start"
			}`}
			onMouseEnter={() => setShowEmojis(true)}
			onMouseLeave={() => setShowEmojis(false)}
		>
			<div
				className={`flex items-center gap-2 w-full ${
					isHuman ? "justify-end" : "justify-start"
				}`}
			>
				{/* DM by current user: show sender and target avatars with arrow */}
				{isHuman ? (
					<div className="flex items-center gap-2">
						<Avatar src={avatar_url} size={24} />
						<span className={`text-sm ${geistMono.className}`}>
							{sender}
						</span>
						<span className="text-xs text-neutral-400 dark:text-neutral-500">
							{time}
						</span>
					</div>
				) : (
					<Dropdown menu={menu} trigger={["click"]}>
						<span className="flex items-center gap-2 cursor-pointer">
							<Avatar src={avatar_url} size={24} />
							<span
								className={`text-sm dark:hover:text-white transition-colors duration-300 text-orange-600 dark:text-neutral-400 ${geistMono.className}`}
							>
								{sender}
							</span>
							<span className="text-xs text-neutral-400 dark:text-neutral-500">
								{time}
							</span>
						</span>
					</Dropdown>
				)}
			</div>
			<div
				className={`w-full ${
					isHuman ? "flex justify-end" : ""
				} relative`}
				style={{ opacity }}
			>
				{/* DM by other: show special content */}
				{!isDmToCurrentUser && isDM ? (
					<div className="italic text-neutral-500 dark:text-neutral-400">
						A private message to {dm_target?.name || "Unknown"}
					</div>
				) : (
					<Markdown
						className={`text-base text-neutral-900 dark:text-neutral-100 max-w-lg ${
							isHuman ? "text-right" : "text-left"
						}`}
					>
						{content}
					</Markdown>
				)}
				{/* Action row: only show on hover, positioned relative to message bubble */}
				{showEmojis && !isHuman && (
					<div className="flex gap-2 absolute right-2 -bottom-4 z-10 bg-white/80 dark:bg-neutral-900/80 px-2 py-1 transition-opacity text-neutral-500 dark:text-neutral-400">
						<Tooltip
							title={copied ? "Copied" : "Copy"}
							placement="top"
						>
							<button
								onClick={async () => {
									await navigator.clipboard.writeText(
										content
									);
									setCopied(true);
									setTimeout(() => setCopied(false), 1500);
								}}
								className="hover:text-orange-600"
								title="Copy"
							>
								<Copy size={18} />
							</button>
						</Tooltip>
						<button className="hover:text-orange-600" title="Reply">
							<Reply size={18} />
						</button>
						<button className="hover:text-orange-600" title="React">
							<Smile size={18} />
						</button>
						<Dropdown menu={messageMenu} trigger={["click"]}>
							<button
								className="hover:text-orange-600"
								title="React"
							>
								<MoreHorizontal size={18} />
							</button>
						</Dropdown>
					</div>
				)}
			</div>
			<div
				className={`flex items-center gap-2 mt-1 ${
					isHuman ? "justify-end" : "justify-start"
				} w-full`}
			>
				{reactions.length > 0 && (
					<div className="flex gap-1">
						{reactions.map((r, i) => (
							<span
								key={i}
								className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-sm cursor-pointer border border-neutral-200 dark:border-neutral-700"
							>
								{r.emoji} {r.count > 1 ? r.count : ""}
							</span>
						))}
					</div>
				)}
			</div>
		</div>
	);
};

export default MessageItem;
