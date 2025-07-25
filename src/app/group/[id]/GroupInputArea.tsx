"use client";

import React, { useState } from "react";
import { Image as ImageIcon, ArrowUp } from "lucide-react";

interface MessageInputFieldProps {
	onSendMessage?: (content: string) => void;
	agentChatLoading?: boolean;
	typingUsers?: string[];
}

const MessageInputField: React.FC<MessageInputFieldProps> = ({
	onSendMessage,
	typingUsers = [],
}) => {
	const [message, setMessage] = useState("");
	const [sending, setSending] = useState(false);
	const [isComposing, setIsComposing] = useState(false); // Track IME composition

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
		if (isComposing) return; // Don't send if composing (IME)
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSubmit(e as any);
		}
	};

	const handleCompositionStart = () => setIsComposing(true);
	const handleCompositionEnd = () => setIsComposing(false);

	const typingUsersString = typingUsers.join(", ") + " are typing...";

	return (
		<div className="fixed left-96 right-96 bottom-0 z-30 max-w-3xl mx-auto">
			<form
				onSubmit={handleSubmit}
				className="flex items-center gap-4 w-full"
			>
				<div className="flex items-center gap-2 flex-1 border border-neutral-200 dark:border-neutral-700 px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800">
					{/* <button
						type="button"
						className="p-1 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors text-neutral-500 dark:text-neutral-400"
						aria-label="Add emoji"
					>
						<Smile size={20} />
					</button> */}
					<input
						type="text"
						value={message}
						onChange={(e) => setMessage(e.target.value)}
						onKeyDown={handleKeyDown}
						onCompositionStart={handleCompositionStart}
						onCompositionEnd={handleCompositionEnd}
						className="flex-1 bg-transparent outline-none border-none text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500"
						placeholder="Type a message..."
						disabled={sending}
					/>
					<button
						type="button"
						className="p-1 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors text-neutral-500 dark:text-neutral-400"
						aria-label="Attach image"
					>
						<ImageIcon size={20} />
					</button>
					<button
						type="submit"
						className={`ml-2 p-2 rounded-lg transition-colors flex items-center gap-2 ${
							message.trim() && !sending
								? "bg-orange-500 dark:bg-orange-600 text-white hover:bg-orange-600 dark:hover:bg-orange-700"
								: "bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400 cursor-not-allowed"
						}`}
						disabled={!message.trim() || sending}
					>
						<ArrowUp />
					</button>
				</div>
			</form>
			<div className="text-xs bg-neutral-100/20 dark:bg-neutral-800/20 backdrop-blur-xs mx-auto text-center py-1 text-neutral-500 dark:text-neutral-400">
				{typingUsers.length > 0 ? typingUsersString : "No one is typing"}
			</div>
		</div>
	);
};

export default MessageInputField;
