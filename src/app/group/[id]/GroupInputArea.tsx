"use client";

import React, { useState } from "react";

interface GroupInputAreaProps {
	onSendMessage?: (content: string) => void;
	agentChatLoading?: boolean;
}

const GroupInputArea: React.FC<GroupInputAreaProps> = ({ onSendMessage }) => {
	const [message, setMessage] = useState("");
	const [sending, setSending] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!message.trim() || !onSendMessage || sending) return;

		setSending(true);
		try {
			await onSendMessage(message.trim());
			setMessage("");
		} catch (error) {
			console.error("Failed to send message:", error);
		} finally {
			setSending(false);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSubmit(e as any);
		}
	};

	return (
		<div className="fixed left-96 right-96 bottom-0 pb-6 z-30 max-w-3xl">
			<form
				onSubmit={handleSubmit}
				className="flex items-center gap-4 w-full"
			>
				<input
					type="text"
					value={message}
					onChange={(e) => setMessage(e.target.value)}
					onKeyDown={handleKeyDown}
					className="flex-1 flex-shrink-0 border border-neutral-200 dark:border-neutral-700 px-4 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400"
					placeholder="Type a message..."
					disabled={sending}
				/>
				<button
					type="submit"
					className={`px-4 py-2 rounded-lg transition-colors ${
						message.trim() && !sending
							? "bg-orange-500 dark:bg-orange-600 text-white hover:bg-orange-600 dark:hover:bg-orange-700"
							: "bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400 cursor-not-allowed"
					}`}
					disabled={!message.trim() || sending}
				>
					{sending ? "Sending..." : "Send"}
				</button>
			</form>
		</div>
	);
};

export default GroupInputArea;
