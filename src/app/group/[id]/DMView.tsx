 "use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Geist_Mono } from "next/font/google";
import MessageItem from "./MessageItem";
import MessageInputField from "./GroupInputArea";
import { Avatar } from "@lobehub/ui";
import {
	useGroupMessages,
	useCurrentUser,
	useGroup,
	useGroupMembers,
} from "@/hooks/useDatabase";
import { dbHelpers } from "@/lib/database";

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

	// Load DM messages
	useEffect(() => {
		const loadDMMessages = async () => {
			if (!user || !groupId) return;

			try {
				setLoading(true);
				
				// Get all sessions for the group
				const sessions = await dbHelpers.db.sessions
					.where("group_id")
					.equals(groupId)
					.toArray();

				const allDMMessages: any[] = [];

				// Get DM messages from all sessions
				for (const session of sessions) {
					const sessionMessages = await dbHelpers.db.messages
						.where("session_id")
						.equals(session.id)
						.and((msg) => msg.type === "dm")
						.toArray();

					// Filter messages between current user and sender
					const relevantDMs = sessionMessages.filter((msg) => {
						const isFromSender = 
							(msg.sender_user_id === senderId || msg.sender_agent_id === senderId);
						const isToSender = msg.dm_target_id === senderId;
						const isFromUser = 
							(msg.sender_user_id === user.id || msg.sender_agent_id === user.id);
						const isToUser = msg.dm_target_id === user.id;

						return (isFromSender && isToUser) || (isFromUser && isToSender);
					});

					// Enhance messages with sender details
					const enhancedMessages = await Promise.all(
						relevantDMs.map(async (message) => {
							let senderUser: any;
							let senderAgent: any;

							if (message.sender_user_id) {
								senderUser = await dbHelpers.db.users.get(message.sender_user_id);
							}
							if (message.sender_agent_id) {
								senderAgent = await dbHelpers.db.agents.get(message.sender_agent_id);
							}

							// Get reactions for the message
							const reactions = await dbHelpers.db.messageReactions
								.where("message_id")
								.equals(message.id)
								.toArray();

							const reactionCounts = reactions.reduce((acc: any, reaction) => {
								acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
								return acc;
							}, {});

							const reactionArray = Object.entries(reactionCounts).map(([emoji, count]) => ({
								emoji,
								count: count as number,
							}));

							return {
								...message,
								senderUser,
								senderAgent,
								reactions: reactionArray,
								session,
							};
						})
					);

					allDMMessages.push(...enhancedMessages);
				}

				// Sort by creation time
				allDMMessages.sort((a, b) => a.created_at.getTime() - b.created_at.getTime());
				setDmMessages(allDMMessages);
			} catch (error) {
				console.error("Error loading DM messages:", error);
			} finally {
				setLoading(false);
			}
		};

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
			await dbHelpers.sendMessage({
				session_id: currentSession.id,
				sender_user_id: user.id,
				content,
				type: "dm",
				dm_target_id: senderId,
			});

			// Reload DM messages
			const sessions = await dbHelpers.db.sessions
				.where("group_id")
				.equals(groupId)
				.toArray();

			const allDMMessages: any[] = [];

			for (const session of sessions) {
				const sessionMessages = await dbHelpers.db.messages
					.where("session_id")
					.equals(session.id)
					.and((msg) => msg.type === "dm")
					.toArray();

				const relevantDMs = sessionMessages.filter((msg) => {
					const isFromSender = 
						(msg.sender_user_id === senderId || msg.sender_agent_id === senderId);
					const isToSender = msg.dm_target_id === senderId;
					const isFromUser = 
						(msg.sender_user_id === user.id || msg.sender_agent_id === user.id);
					const isToUser = msg.dm_target_id === user.id;

					return (isFromSender && isToUser) || (isFromUser && isToSender);
				});

				const enhancedMessages = await Promise.all(
					relevantDMs.map(async (message) => {
						let senderUser: any;
						let senderAgent: any;

						if (message.sender_user_id) {
							senderUser = await dbHelpers.db.users.get(message.sender_user_id);
						}
						if (message.sender_agent_id) {
							senderAgent = await dbHelpers.db.agents.get(message.sender_agent_id);
						}

						const reactions = await dbHelpers.db.messageReactions
							.where("message_id")
							.equals(message.id)
							.toArray();

						const reactionCounts = reactions.reduce((acc: any, reaction) => {
							acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
							return acc;
						}, {});

						const reactionArray = Object.entries(reactionCounts).map(([emoji, count]) => ({
							emoji,
							count: count as number,
						}));

						return {
							...message,
							senderUser,
							senderAgent,
							reactions: reactionArray,
							session,
						};
					})
				);

				allDMMessages.push(...enhancedMessages);
			}

			allDMMessages.sort((a, b) => a.created_at.getTime() - b.created_at.getTime());
			setDmMessages(allDMMessages);
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
			const sessions = await dbHelpers.db.sessions
				.where("group_id")
				.equals(groupId)
				.toArray();

			const allDMMessages: any[] = [];

			for (const session of sessions) {
				const sessionMessages = await dbHelpers.db.messages
					.where("session_id")
					.equals(session.id)
					.and((msg) => msg.type === "dm")
					.toArray();

				const relevantDMs = sessionMessages.filter((msg) => {
					const isFromSender = 
						(msg.sender_user_id === senderId || msg.sender_agent_id === senderId);
					const isToSender = msg.dm_target_id === senderId;
					const isFromUser = 
						(msg.sender_user_id === user.id || msg.sender_agent_id === user.id);
					const isToUser = msg.dm_target_id === user.id;

					return (isFromSender && isToUser) || (isFromUser && isToSender);
				});

				const enhancedMessages = await Promise.all(
					relevantDMs.map(async (message) => {
						let senderUser: any;
						let senderAgent: any;

						if (message.sender_user_id) {
							senderUser = await dbHelpers.db.users.get(message.sender_user_id);
						}
						if (message.sender_agent_id) {
							senderAgent = await dbHelpers.db.agents.get(message.sender_agent_id);
						}

						const reactions = await dbHelpers.db.messageReactions
							.where("message_id")
							.equals(message.id)
							.toArray();

						const reactionCounts = reactions.reduce((acc: any, reaction) => {
							acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
							return acc;
						}, {});

						const reactionArray = Object.entries(reactionCounts).map(([emoji, count]) => ({
							emoji,
							count: count as number,
						}));

						return {
							...message,
							senderUser,
							senderAgent,
							reactions: reactionArray,
							session,
						};
					})
				);

				allDMMessages.push(...enhancedMessages);
			}

			allDMMessages.sort((a, b) => a.created_at.getTime() - b.created_at.getTime());
			setDmMessages(allDMMessages);
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
			className="flex-1 flex flex-col justify-end px-0 sm:px-8 py-8 relative min-h-screen max-w-2xl mx-auto"
		>
			{/* Header */}
			<div className="flex items-center gap-3 mb-6 px-4">
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
					<p className="text-sm text-neutral-500 dark:text-neutral-400">
						Direct Message
					</p>
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
							<div className="text-neutral-500 dark:text-neutral-600 text-sm">
								Start a conversation with {senderName}
							</div>
						</div>
					) : (
						dmMessages.map((msg, idx) => (
							<React.Fragment key={msg.id}>
								<MessageItem
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
									type={msg.type}
									currentUserId={user?.id}
									senderUser={msg.senderUser}
									senderAgent={msg.senderAgent}
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
