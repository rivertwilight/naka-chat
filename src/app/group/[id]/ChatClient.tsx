"use client";

import React, { useEffect, useState, useRef } from "react";
import { notFound } from "next/navigation";
import { Geist_Mono } from "next/font/google";
import MessageInputField from "./GroupInputArea";
import MessageItem from "./MessageItem";
import SidebarRight from "../../SidebarRight";
import {
	useGroupMessages,
	useCurrentUser,
	useGroup,
} from "@/hooks/useDatabase";
import {
	AgentGroupChat,
	GroupChatMember,
	SupervisorDecision,
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
	const [agentChatLoading, setAgentChatLoading] = useState(false);
	const [previousMessageCount, setPreviousMessageCount] = useState(0);
	const [pendingSpeakers, setPendingSpeakers] = useState<string[]>([]);
	const { user } = useCurrentUser();
	const { group } = useGroup(groupId);
	const { messages, sendMessage, addReaction } = useGroupMessages(groupId);
	const { provider, apiKey, baseUrl } = usePersistance();

	const messagesEndRef = useRef<HTMLDivElement | null>(null);
	const agentGroupChatRef = useRef<AgentGroupChat | null>(null);
	const messageInputRef = useRef<any>(null);

	useEffect(() => {
		if (groupId && provider === "Google") {
			agentGroupChatRef.current = new AgentGroupChat(groupId, {
				provider,
				apiKey,
				baseUrl,
			});
		}
	}, [groupId, provider, apiKey, baseUrl]);

	// Only auto-scroll when there are new messages
	useEffect(() => {
		const hasNewMessages = messages.length > previousMessageCount;

		if (hasNewMessages && messagesEndRef.current) {
			messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
		}

		setPreviousMessageCount(messages.length);
	}, [messages, previousMessageCount]);

	const handleSendMessage = async (content: string) => {
		if (!user || !agentGroupChatRef.current) return;

		try {
			await sendMessage(content, user.id);
			setAgentChatLoading(true);

			// Wait a moment for the message to be saved, then trigger agent responses
			setTimeout(async () => {
				try {
					const agentGroupChat = agentGroupChatRef.current!;
					const members: GroupChatMember[] =
						await agentGroupChat.getGroupMembers();

					const updatedHistory: MessageWithDetails[] = [
						...messages,
						{
							content,
							senderUser: {
								name:
									members.find((m: GroupChatMember) => m.id === user.id)
										?.name || "User",
							},
						} as MessageWithDetails,
					];

					const currentHistory =
						agentGroupChat.formatConversationHistory(updatedHistory);
					const decision: SupervisorDecision =
						await agentGroupChat.makeSupervisionDecision(
							members,
							currentHistory,
							group?.name || "Group",
							group?.description || ""
						);

					// Only show agent names (not 'human')
					const agentNames = decision.nextSpeaker
						.filter((speaker: string) => speaker !== "human")
						.map((speaker: string) => {
							const found = members.find(
								(m: GroupChatMember) => m.id === speaker || m.name === speaker
							);
							return found?.name || speaker;
						});

					setPendingSpeakers(agentNames);

					// Now trigger the normal process
					await agentGroupChat.processHumanMessage(
						content,
						user.id,
						messages,
						group?.name || "Group",
						group?.description || ""
					);
				} catch (error) {
					console.error("Error in agent conversation:", error);
				} finally {
					setAgentChatLoading(false);
				}
			}, 500);
		} catch (error) {
			console.error("Error sending message:", error);
			setAgentChatLoading(false);
		}
	};

	const handleReaction = async (messageId: string, emoji: string) => {
		if (!user) return;
		await addReaction(messageId, emoji, user.id);
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

			// Add the message
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
					/>
				</React.Fragment>
			);
		});

		return result;
	};

	// Remove agent from pendingSpeakers when their message arrives
	useEffect(() => {
		if (pendingSpeakers.length === 0) return;
		const agentNames = pendingSpeakers;
		const agentMessages = messages.filter(
			(msg) => msg.senderAgent && agentNames.includes(msg.senderAgent.name)
		);
		if (agentMessages.length > 0) {
			const stillPending = agentNames.filter(
				(name) => !agentMessages.some((msg) => msg.senderAgent?.name === name)
			);
			setPendingSpeakers(stillPending);
		}
	}, [messages, pendingSpeakers]);

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
			<main className="flex-1 flex flex-col justify-end px-0 sm:px-8 py-8 relative min-h-screen">
				<section className="flex-1 flex flex-col justify-end gap-0 max-w-2xl mx-auto w-full pb-24 relative">
					<div className="flex flex-col min-h-[200px]">
						{messages.length === 0 ? (
							<div className="absolute inset-0 flex flex-col items-start justify-end py-24 pointer-events-none select-none z-10">
								{randomExamples.map((example, idx) => (
									<button
										key={idx}
										onClick={() => handleExampleClick(example)}
										className="flex gap-2 text-neutral-400 dark:text-neutral-500 text-lg font-medium mb-2 opacity-80 pointer-events-auto select-auto hover:text-neutral-700 dark:hover:text-white transition-colors duration-300 focus:outline-none"
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
					agentChatLoading={agentChatLoading}
					typingUsers={pendingSpeakers}
					groupName={group?.name}
				/>
			</main>
			<SidebarRight groupId={groupId} />
		</>
	);
}
