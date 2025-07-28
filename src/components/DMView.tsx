"use client";

import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import MessageBlock from "@/components/ChatMessageBlock";
import MessageInputField from "@/components/GroupInputArea";
import { Avatar } from "@lobehub/ui";
import { useDMMessages, useCurrentUser } from "@/hooks/useDatabase";

interface DMViewProps {
	groupId: string;
	senderId: string;
	senderName: string;
	senderAvatar?: string;
	onBack: () => void;
	onMessageSent?: () => void; // Callback to trigger after sending DM
}

export default function DMView({
	groupId,
	senderId,
	senderName,
	senderAvatar,
	onBack,
	onMessageSent,
}: DMViewProps) {
	const messagesEndRef = useRef<HTMLDivElement | null>(null);
	const messageInputRef = useRef<any>(null);
	const { user } = useCurrentUser();

	// Use the new DM messages hook
	const {
		messages: dmMessages,
		loading,
		error,
		sendDMMessage,
		addReaction,
	} = useDMMessages(groupId, senderId);

	// Auto-scroll to bottom when new messages arrive
	useEffect(() => {
		if (messagesEndRef.current) {
			messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
		}
	}, [dmMessages]);

	const handleSendMessage = async (content: string) => {
		await sendDMMessage(content);
		// Trigger callback to notify that a message was sent (for supervision triggers)
		if (onMessageSent) {
			onMessageSent();
		}
	};

	if (loading) {
		return (
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				className="flex-1 flex flex-col justify-center items-center px-0 sm:px-8 py-8 relative min-h-screen"
			>
				<div className="text-neutral-500 dark:text-neutral-400">
					Loading DM messages...
				</div>
			</motion.div>
		);
	}

	if (error) {
		return (
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				className="flex-1 flex flex-col justify-center items-center px-0 sm:px-8 py-8 relative min-h-screen"
			>
				<div className="text-red-500 dark:text-red-400">
					Error loading DM messages: {error}
				</div>
			</motion.div>
		);
	}

	return (
		<motion.div
			initial={{ opacity: 0, x: 20 }}
			animate={{ opacity: 1, x: 0 }}
			exit={{ opacity: 0, x: -20 }}
			transition={{ duration: 0.3, ease: "easeInOut" }}
			className="flex-1 flex flex-col justify-end px-0 py-8 relative min-h-screen max-w-2xl mx-auto"
		>
			{/* Header */}
			<div className="flex items-center justify-between mb-6">
				<div className="flex items-center gap-3">
					<button
						onClick={onBack}
						className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
						aria-label="Back to group chat"
					>
						<ArrowLeft size={20} />
					</button>
					<Avatar src={senderAvatar} size={32} />
					<div className="flex flex-col">
						<h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
							{senderName}
						</h2>
					</div>
				</div>
			</div>

			{/* Messages */}
			<section className="flex-1 flex flex-col justify-end gap-0 max-w-2xl mx-auto w-full pb-24 relative">
				<div className="flex flex-col min-h-[200px]">
					{dmMessages.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-24 text-center">
							<div className="text-neutral-400 dark:text-neutral-500 text-lg mb-2">
								No messages yet
							</div>
						</div>
					) : (
						dmMessages.map((msg) => {
							// Determine side based on sender
							const isCurrentUserMessage = msg.sender?.id === user?.id;
							const side = isCurrentUserMessage ? "right" : "left";

							return (
								<React.Fragment key={msg.id}>
									<MessageBlock
										message={msg}
										side={side}
										enableActions={true}
									/>
								</React.Fragment>
							);
						})
					)}
					<div ref={messagesEndRef} />
				</div>
			</section>

			{/* Input */}
			<MessageInputField
				ref={messageInputRef}
				onSendMessage={handleSendMessage}
				agentChatLoading={false}
				typingUsers={[]}
				groupName={`${senderName}`}
			/>
		</motion.div>
	);
}
