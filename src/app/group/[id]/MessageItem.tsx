"use client";

import React, { useState } from "react";
import { Avatar, Dropdown, Markdown } from "@lobehub/ui";

import { type DropdownProps, Icon } from "@lobehub/ui";
import { AtSign, Settings } from "lucide-react";

export const menu: DropdownProps["menu"] = {
	items: [
		{
			icon: <Icon icon={AtSign} />,
			key: "copy",
			label: "Mention",
		},
		{
			icon: <Icon icon={Settings} />,
			key: "selectAll",
			label: "Customize",
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
}

const EMOJI_LIST = ["👍", "😊", "🎉", "❤️", "😂", "😮"];

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
}) => {
	const isHuman = sender === "You";
	const [showEmojis, setShowEmojis] = useState(false);

	const Avatar = () =>
		avatar_url ? (
			<img
				src={avatar_url}
				alt={sender}
				className="w-7 h-7 rounded-full object-cover border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 mr-2"
			/>
		) : (
			<span className="w-7 h-7 flex items-center justify-center rounded-full bg-neutral-200 dark:bg-neutral-800 mr-2">
				<UserIcon className="w-5 h-5 text-neutral-400" />
			</span>
		);

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
				{!isHuman && (
					<Dropdown menu={menu} trigger={["click"]}>
						<span className="flex items-center gap-2 cursor-pointer">
							<Avatar src={avatar_url} size={24} />
							<span
								className={`text-sm text-orange-600 dark:text-neutral-400 ${geistMono.className}`}
							>
								{sender}
							</span>
						</span>
					</Dropdown>
				)}
				<span className="text-xs text-neutral-400 dark:text-neutral-500">
					{time}
				</span>
				<div
					className={`flex-1 border-b border-dotted border-neutral-300 dark:border-neutral-700 ml-2 ${
						isHuman ? "order-first mr-2 ml-0" : ""
					}`}
				/>
				{isHuman && (
					<span className="flex items-center">
						<Avatar />
						<span
							className={`text-sm text-orange-600 dark:text-neutral-400 ${geistMono.className}`}
						>
							{sender}
						</span>
					</span>
				)}
			</div>
			<div className={`w-full ${isHuman ? "flex justify-end" : ""}`}>
				<Markdown
					className={`text-base text-neutral-900 dark:text-neutral-100 max-w-lg ${
						isHuman ? "text-right" : "text-left"
					}`}
				>
					{content}
				</Markdown>
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
