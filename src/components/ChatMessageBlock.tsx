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
import { Geist_Mono } from "next/font/google";
import { MessageWithDetails } from "@/lib/database";
import { formatTimestamp } from "@/utils/dateUtils";

const geistMono = Geist_Mono({
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
});

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

interface MessageBlockProps {
	message: MessageWithDetails;
	side: "left" | "right";
	className?: string;
	enableActions?: boolean;
}

/**
 * Message with actions
 */
const MessageBlock: React.FC<MessageBlockProps> = ({
	message,
	side,
	className = "",
	enableActions = true,
}) => {
	const [showEmojis, setShowEmojis] = useState(false);
	const [copied, setCopied] = useState(false);

	// Calculate opacity: messages older than 1 hour use minOpacity, else full opacity
	const now = Date.now();
	const msgTime = new Date(message.created_at).getTime();
	const oneHour = 1000 * 60 * 60;
	const minOpacity = 0.75;
	const opacity = now - msgTime >= oneHour ? minOpacity : 1;

	return (
		<div
			className={`flex flex-col gap-4 py-2 mt-2 ${
				side === "left" ? "items-start" : "items-end"
			} ${className}`}
			onMouseEnter={() => setShowEmojis(true)}
			onMouseLeave={() => setShowEmojis(false)}
		>
			<div
				className={`flex items-center gap-2 w-full ${
					side === "left" ? "justify-start" : "justify-end"
				}`}
			>
				{side === "right" ? (
					<div className="flex items-center gap-2">
						<Avatar src={message.sender?.avatar_url} size={24} />
						<span
							className={`text-sm text-orange-600 dark:text-orange-400 ${geistMono.className}`}
						>
							{message.sender?.name}
						</span>
						<span className="text-xs text-neutral-400 dark:text-neutral-500">
							{formatTimestamp(message.created_at)}
						</span>
					</div>
				) : (
					<Dropdown menu={menu} trigger={["click"]}>
						<span className="flex items-center gap-2 cursor-pointer">
							<Avatar
								src={message.sender?.avatar_url}
								size={24}
							/>
							<span
								className={`text-sm dark:hover:text-white transition-colors duration-300 text-orange-600 dark:text-neutral-400 ${geistMono.className}`}
							>
								{message.sender?.name}
							</span>
							<span className="text-xs text-neutral-400 dark:text-neutral-500">
								{formatTimestamp(message.created_at)}
							</span>
						</span>
					</Dropdown>
				)}
			</div>
			<div
				className={`w-full ${
					side === "left" ? "flex justify-start" : "flex justify-end"
				} relative`}
				style={{ opacity }}
			>
				<Markdown
					className={`text-base text-neutral-900 dark:text-neutral-100 max-w-full sm:max-w-lg break-words ${
						side === "left" ? "text-left" : "text-right"
					}`}
				>
					{message.content}
				</Markdown>
				{/* Action row: only show on hover, positioned relative to message bubble */}
				{enableActions && showEmojis && (
					<div className="flex gap-2 absolute right-2 -bottom-4 z-10 bg-white/80 dark:bg-neutral-900/80 px-2 py-1 transition-opacity text-neutral-500 dark:text-neutral-400">
						<Tooltip
							title={copied ? "Copied" : "Copy"}
							placement="top"
						>
							<button
								onClick={async () => {
									await navigator.clipboard.writeText(
										message.content
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
					side === "left" ? "justify-start" : "justify-end"
				} w-full`}
			>
				{message.reactions.length > 0 && (
					<div className="flex gap-1">
						{message.reactions.map((r, i) => (
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

export default MessageBlock;
