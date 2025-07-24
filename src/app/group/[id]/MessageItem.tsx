"use client";

import React, { useState } from "react";
import { Markdown } from "@lobehub/ui";

interface MessageItemProps {
	messageId: string;
	sender: string;
	time: string;
	content: string;
	geistMono: { className: string };
	idx: number;
	reactions?: { emoji: string; count: number }[];
	onReact?: (emoji: string) => void;
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
}) => {
	const isHuman = sender === "You";
	const [showEmojis, setShowEmojis] = useState(false);

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
					<span
						className={`text-sm text-orange-600 dark:text-neutral-400 ${geistMono.className}`}
					>
						{sender}
					</span>
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
					<span
						className={`text-sm text-orange-600 dark:text-neutral-400 ${geistMono.className}`}
					>
						{sender}
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
