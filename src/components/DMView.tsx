"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Geist_Mono } from "next/font/google";
import PublicMessageBlock from "@/components/PublicMessageBlock";
import MessageInputField from "@/components/GroupInputArea";
import { Avatar } from "@lobehub/ui";
import { useCurrentUser, useGroup, useGroupMembers } from "@/hooks/useDatabase";
import { dbHelpers, db } from "@/lib/database";

const geistMono = Geist_Mono({
	weight: ["400"],
	subsets: ["latin"],
});

interface DMViewProps {
	groupId: string;
	senderId: string;
	senderName: string;
	senderAvatar?: string;
	onBack: () => void;
}

export default function DMView({
	groupId,
	senderId,
	senderName,
	senderAvatar,
	onBack,
}: DMViewProps) {
	const [dmMessages, setDmMessages] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const { user } = useCurrentUser();
	const { group } = useGroup(groupId);
	const { members: groupMembers } = useGroupMembers(groupId);
	const messagesEndRef = useRef<HTMLDivElement | null>(null);
	const messageInputRef = useRef<any>(null);

	// Load DM messages function
	const loadDMMessages = async () => {
		if (!user || !groupId) return;

		try {
			setLoading(true);

			// Use the new helper function to get DM messages
			const dmMessages = await dbHelpers.getDMMessages(
				groupId,
				user.id,
				senderId
			);

			// Enhance messages with sender details
			const enhancedMessages = await Promise.all(
				dmMessages.map(async (message) => {
					let senderUser: any;
					let senderAgent: any;

					if (message.sender_user_id) {
						senderUser = await db.users.get(message.sender_user_id);
					}
					if (message.sender_agent_id) {
						senderAgent = await db.agents.get(message.sender_agent_id);
					}

					// Get session info
					const session = await db.sessions.get(message.session_id);

					return {
						...message,
						senderUser,
						senderAgent,
						session,
					};
				})
			);

			setDmMessages(enhancedMessages);
		} catch (error) {
			console.error("Error loading DM messages:", error);
		} finally {
			setLoading(false);
		}
	};

	// Load DM messages on mount
	useEffect(() => {
		loadDMMessages();
	}, [groupId, senderId, user]);

	// Auto-scroll to bottom when new messages arrive
	useEffect(() => {
		if (messagesEndRef.current) {
			messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
		}
	}, [dmMessages]);

	const handleSendMessage = async (content: string) => {
		if (!user || !groupId) return;

		try {
			// Get current session
			const currentSession = await dbHelpers.getCurrentSession(groupId);

			// Send DM message
			await dbHelpers.sendDMMessage(
				currentSession.id,
				user.id,
				content,
				senderId
			);

			// Reload DM messages
			await loadDMMessages();
		} catch (error) {
			console.error("Error sending DM message:", error);
		}
	};

	const handleReaction = async (messageId: string, emoji: string) => {
		if (!user) return;
		try {
			await dbHelpers.addReaction({
				message_id: messageId,
				emoji,
				user_id: user.id,
			});

			// Reload messages to update reactions
			await loadDMMessages();
		} catch (error) {
			console.error("Error adding reaction:", error);
		}
	};

	// Format time from Date to HH:MM
	const formatTime = (date: Date) => {
		return date.toLocaleTimeString("en-US", {
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
		});
	};

	// Get sender name from message
	const getSenderName = (message: any) => {
		if (message.senderUser) {
			return user && message.senderUser.id === user.id
				? "You"
				: message.senderUser.name;
		}
		if (message.senderAgent) {
			return message.senderAgent.name;
		}
		return "Unknown";
	};

	// Get sender avatar from message
	const getSenderAvatar = (message: any) => {
		if (message.senderUser) {
			return user && message.senderUser.id === user.id
				? user.avatar_url
				: message.senderUser.avatar_url;
		}
		if (message.senderAgent) {
			return message.senderAgent.avatar_url;
		}
		return undefined;
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
				<button
					onClick={loadDMMessages}
					className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
					aria-label="Refresh messages"
					disabled={loading}
				>
					<RefreshCw size={20} className={loading ? "animate-spin" : ""} />
				</button>
			</div>

			{/* Messages */}
			<section className="flex-1 flex flex-col justify-end gap-0 max-w-2xl mx-auto w-full pb-24 relative">
				<div className="flex flex-col min-h-[200px]">
					{dmMessages.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-24 text-center">
							<div className="text-neutral-400 dark:text-neutral-500 text-lg mb-2">
								No messages yet
							</div>
							<div className="text-neutral-500 dark:text-neutral-600 text-sm">
								Start a conversation with {senderName}
							</div>
							<div className="text-neutral-400 dark:text-neutral-500 text-xs mt-2">
								Messages sent here will be private between you and {senderName}
							</div>
						</div>
					) : (
						dmMessages.map((msg, idx) => (
							<React.Fragment key={msg.id}>
								<PublicMessageBlock
									messageId={msg.id}
									sender={getSenderName(msg)}
									time={formatTime(msg.created_at)}
									content={msg.content}
									geistMono={geistMono}
									idx={idx}
									reactions={msg.reactions || []}
									onReact={(emoji) => handleReaction(msg.id, emoji)}
									avatar_url={getSenderAvatar(msg)}
									created_at={msg.created_at}
									senderUser={msg.senderUser}
									senderAgent={msg.senderAgent}
									currentUserId={user?.id}
									showActions={true}
								/>
							</React.Fragment>
						))
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
				groupName={`DM with ${senderName}`}
			/>
		</motion.div>
	);
}
