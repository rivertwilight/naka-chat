"use client";

import React, { useEffect, useState, useRef } from "react";
import { notFound } from "next/navigation";
import { Geist_Mono } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";
import MessageInputField from "@/components/GroupInputArea";
import MessageItem from "@/components/MessageItem";
import DMView from "@/components/DMView";
import SidebarRight from "@/components/SidebarRight";
import {
	useGroupMessages,
	useCurrentUser,
	useGroup,
	useGroupMembers,
} from "@/hooks/useDatabase";
import {
	AgentGroupChat,
	GroupChatMember,
	MessageWithDetails,
} from "@/lib/agentGroupChat";
import { usePersistance } from "@/components/PersistanceContext";
import { ArrowRight } from "lucide-react";

const geistMono = Geist_Mono({
	weight: ["400"],
	subsets: ["latin"],
});

interface ChatClientProps {
	groupId: string;
}

export default function ChatClient({ groupId }: ChatClientProps) {
	const [loading, setLoading] = useState(false);
	const [previousMessageCount, setPreviousMessageCount] = useState(0);
	const [typingAgents, setTypingAgents] = useState<string[]>([]);
	const [dmView, setDmView] = useState<{
		senderId: string;
		senderName: string;
		senderAvatar?: string;
	} | null>(null);
	const { user } = useCurrentUser();
	const { group } = useGroup(groupId);
	const { messages, sendMessage, addReaction } = useGroupMessages(groupId);
	const { provider, getApiKey, baseUrl, modelId } = usePersistance();
	const { members: groupMembers } = useGroupMembers(groupId);

	const messagesEndRef = useRef<HTMLDivElement | null>(null);
	const agentGroupChatRef = useRef<AgentGroupChat | null>(null);
	const messageInputRef = useRef<any>(null);

	useEffect(() => {
		if (groupId) {
			agentGroupChatRef.current = new AgentGroupChat(groupId, {
				provider,
				apiKey: getApiKey(provider),
				baseUrl,
				modelId,
			});
			
			// Set up typing change callback
			agentGroupChatRef.current.setOnTypingChange((typingAgentNames) => {
				setTypingAgents(typingAgentNames);
			});
			
			// Start monitoring when AgentGroupChat is created
			agentGroupChatRef.current.startMonitoring();
		}
		
		// Cleanup function to stop monitoring
		return () => {
			if (agentGroupChatRef.current) {
				agentGroupChatRef.current.stopMonitoring();
			}
		};
	}, [groupId, provider, getApiKey, baseUrl]);

	// Only auto-scroll when there are new messages
	useEffect(() => {
		const hasNewMessages = messages.length > previousMessageCount;

		if (hasNewMessages && messagesEndRef.current) {
			messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
		}

		setPreviousMessageCount(messages.length);
	}, [messages, previousMessageCount]);

	const handleSendMessage = async (content: string) => {
		if (!user) return;

		try {
			await sendMessage(content, user.id);
			// That's it! AgentGroupChat will automatically detect the new message
			// and trigger supervision after 3 seconds of idle time
		} catch (error) {
			console.error("Error sending message:", error);
		}
	};

	const handleReaction = async (messageId: string, emoji: string) => {
		if (!user) return;
		await addReaction(messageId, emoji, user.id);
	};

	const handleDmClick = (
		senderId: string,
		senderName: string,
		senderAvatar?: string
	) => {
		setDmView({
			senderId,
			senderName,
			senderAvatar,
		});
	};

	const handleBackFromDM = () => {
		setDmView(null);
	};

	const exampleSuggestions = [
		"我们来模拟联合国，Morgan 是主持人，开始吧",
		"我是皇上，你们是后宫的嫔妃，背景是清朝",
		"我们来玩 COC，我是 KP",
		"我们来玩 DND, KP",
		"你们开个辩论会，X 是主持人，不要让我干涉",
		"我们来玩狼人杀，我是主持人",
	];

	// Randomly select 3 examples each render
	const getRandomExamples = (examples: string[], count: number) => {
		const shuffled = [...examples].sort(() => 0.5 - Math.random());
		return shuffled.slice(0, count);
	};
	const [randomExamples, setRandomExamples] = useState<string[]>([]);

	useEffect(() => {
		setRandomExamples(getRandomExamples(exampleSuggestions, 3));
		// Only run on mount, or if exampleSuggestions changes
	}, []);

	const handleExampleClick = (example: string) => {
		if (
			messageInputRef.current &&
			typeof messageInputRef.current.fillMessage === "function"
		) {
			messageInputRef.current.fillMessage(example);
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

	// Format date for session divider
	const formatDate = (date: Date) => {
		return date.toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
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

	// Get DM target user/agent for a message
	const getDmTarget = (message: any) => {
		if (!message.dm_target_id) return null;
		// Try to find in groupMembers
		const target = groupMembers.find(
			(m: any) =>
				(m.user_id && m.user_id === message.dm_target_id) ||
				(m.agent_id && m.agent_id === message.dm_target_id)
		);
		return target?.details || null;
	};

	// Group messages by session and add dividers
	const renderMessagesWithDividers = () => {
		if (messages.length === 0) return null;

		const result: React.ReactElement[] = [];
		let currentSessionId: string | null = null;

		messages.forEach((msg, idx) => {
			// Add session divider if this is a new session
			if (msg.session && msg.session.id !== currentSessionId) {
				currentSessionId = msg.session.id;
				result.push(
					<div
						key={`divider-${msg.session.id}`}
						className="flex items-center justify-center gap-4 py-4 my-4"
					>
						<div className="px-4 py-2 italic">
							<span className="text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase tracking-wide italic">
								{msg.session.name || "Session"} -{" "}
								{formatDate(msg.session.created_at)}
							</span>
						</div>
					</div>
				);
			}

			result.push(
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
						dm_target={getDmTarget(msg)}
						currentUserId={user?.id}
						senderUser={msg.senderUser}
						senderAgent={msg.senderAgent}
						onDmClick={handleDmClick}
					/>
				</React.Fragment>
			);
		});

		return result;
	};



	if (loading) {
		return (
			<>
				<main className="flex-1 flex flex-col justify-center items-center px-0 sm:px-8 py-8 relative min-h-screen">
					<div className="text-neutral-500 dark:text-neutral-400">
						Loading...
					</div>
				</main>
				<SidebarRight groupId={groupId} />
			</>
		);
	}

	if (!groupId) {
		notFound();
	}

	return (
		<>
			<AnimatePresence mode="wait">
				{dmView ? (
					<DMView
						key="dm-view"
						groupId={groupId}
						senderId={dmView.senderId}
						senderName={dmView.senderName}
						senderAvatar={dmView.senderAvatar}
						onBack={handleBackFromDM}
					/>
				) : (
					<motion.main
						key="group-chat"
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: 20 }}
						transition={{ duration: 0.3, ease: "easeInOut" }}
						className="flex-1 flex flex-col justify-end px-0 sm:px-8 py-8 relative min-h-screen"
					>
						<section className="flex-1 flex flex-col justify-end gap-0 max-w-2xl mx-auto w-full pb-24 relative">
							<div className="flex flex-col min-h-[200px]">
								{messages.length === 0 ? (
									<div className="absolute inset-0 flex flex-col items-start justify-end py-24 pointer-events-none select-none z-10">
										{randomExamples.map((example, idx) => (
											<button
												key={idx}
												onClick={() =>
													handleExampleClick(example)
												}
												className="flex gap-2 text-neutral-400 dark:text-neutral-500 text-lg font-medium mb-2 opacity-80 pointer-events-auto select-auto hover:text-neutral-800 dark:hover:text-white transition-colors duration-300 focus:outline-none"
											>
												<ArrowRight />
												{example}
											</button>
										))}
									</div>
								) : (
									renderMessagesWithDividers()
								)}
								<div ref={messagesEndRef} />
							</div>
						</section>
						<MessageInputField
							ref={messageInputRef}
							onSendMessage={handleSendMessage}
							typingUsers={typingAgents}
							groupName={group?.name}
						/>
					</motion.main>
				)}
			</AnimatePresence>
			<SidebarRight groupId={groupId} />
		</>
	);
}
