"use client";

import React, { useState, useRef, useEffect } from "react";
import { Smile, Image as ImageIcon, ArrowUp } from "lucide-react";

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
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	// 动态调整 textarea 高度
	const adjustTextareaHeight = () => {
		const textarea = textareaRef.current;
		if (textarea) {
			textarea.style.height = "auto";
			// 计算内容高度
			const contentHeight = textarea.scrollHeight;

			console.log(textarea);

			const minHeight = 24;
			const maxHeight = 120;

			// 计算最终高度
			const finalHeight = Math.min(
				Math.max(contentHeight, minHeight),
				maxHeight
			);

			// 设置textarea高度
			textarea.style.height = `${finalHeight}px`;
		}
	};

	// 当消息内容变化时调整高度
	useEffect(() => {
		adjustTextareaHeight();
	}, [message]);

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

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (isComposing) return;

		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSubmit(e as any);
		}
	};

	const handleCompositionStart = () => setIsComposing(true);
	const handleCompositionEnd = () => setIsComposing(false);

	const typingUsersString = typingUsers.join(", ") + " are typing...";

	return (
		<div className="fixed left-96 right-96 bottom-0 pb-6 z-30 max-w-3xl mx-auto">
			<form onSubmit={handleSubmit} className="flex items-end gap-4 w-full">
				<div className="flex items-end gap-2 flex-1 border border-neutral-200 dark:border-neutral-700 px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 transition-all duration-200">
					<button
						type="button"
						className="p-1 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors text-neutral-500 dark:text-neutral-400 mb-1 flex-shrink-0"
						aria-label="Add emoji"
					>
						<Smile size={20} />
					</button>
					<textarea
						ref={textareaRef}
						value={message}
						name="textarea"
						onChange={(e) => setMessage(e.target.value)}
						onKeyDown={handleKeyDown}
						className="flex-1 self-center bg-transparent outline-none border-none text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 resize-none overflow-y-auto leading-6"
						placeholder="Type a message..."
						disabled={sending}
					/>
					<button
						type="button"
						className="p-1 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors text-neutral-500 dark:text-neutral-400 mb-1 flex-shrink-0"
						aria-label="Attach image"
					>
						<ImageIcon size={20} />
					</button>
					<button
						type="submit"
						className={`ml-2 p-2 rounded-lg transition-colors flex items-center gap-2 mb-1 flex-shrink-0 ${
							message.trim() && !sending
								? "bg-orange-500 dark:bg-orange-600 text-white hover:bg-orange-600 dark:hover:bg-orange-700"
								: "bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400 cursor-not-allowed"
						}`}
						disabled={!message.trim() || sending}
					>
						<ArrowUp size={16} />
					</button>
				</div>
			</form>
			<div className="text-xs h-6 bg-neutral-100/20 dark:bg-neutral-800/20 backdrop-blur-xs mx-auto text-center py-1 text-neutral-500 dark:text-neutral-400">
				{typingUsers.length > 0 ? typingUsersString : ""}
			</div>
		</div>
	);
};

export default MessageInputField;
