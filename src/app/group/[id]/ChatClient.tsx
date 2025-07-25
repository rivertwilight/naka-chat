"use client";

import React, { useEffect, useState, useRef } from "react";
import { notFound } from "next/navigation";
import { Geist_Mono } from "next/font/google";
import GroupInputArea from "./GroupInputArea";
import MessageItem from "./MessageItem";
import SidebarRight from "../../SidebarRight";
import {
	useGroupMessages,
	useCurrentUser,
	useGroup,
} from "../../../hooks/useDatabase";
import { AgentGroupChat } from "../../../lib/agentGroupChat";

const geistMono = Geist_Mono({
	weight: ["400"],
	subsets: ["latin"],
});

interface ChatClientProps {
	groupId: string;
}

export default function ChatClient({ groupId }: ChatClientProps) {
	const [actualGroupId, setActualGroupId] = useState<string | null>(groupId);
	const [loading, setLoading] = useState(false);
	const [agentChatLoading, setAgentChatLoading] = useState(false);
	const [previousMessageCount, setPreviousMessageCount] = useState(0);
	const { user } = useCurrentUser();
	const { group } = useGroup(actualGroupId);
	const { messages, sendMessage, addReaction } =
		useGroupMessages(actualGroupId);

	const messagesEndRef = useRef<HTMLDivElement | null>(null);
	const agentGroupChatRef = useRef<AgentGroupChat | null>(null);

	useEffect(() => {
		if (actualGroupId) {
			agentGroupChatRef.current = new AgentGroupChat(actualGroupId);
		}
	}, [actualGroupId]);

	// Only auto-scroll when there are new messages
	useEffect(() => {
		const hasNewMessages = messages.length > previousMessageCount;

		if (hasNewMessages && messagesEndRef.current) {
			messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
		}

		setPreviousMessageCount(messages.length);
	}, [messages, previousMessageCount]);

	const handleSendMessage = async (content: string) => {
		if (!user || !actualGroupId || !agentGroupChatRef.current) return;

		try {
			// Send the human message first
			await sendMessage(content, user.id);

			// Trigger agent conversation
			setAgentChatLoading(true);

			// Wait a moment for the message to be saved, then trigger agent responses
			setTimeout(async () => {
				try {
					await agentGroupChatRef.current!.processHumanMessage(
						content,
						user.id,
						messages
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
				<SidebarRight groupId={actualGroupId} />
			</>
		);
	}

	if (!actualGroupId) {
		notFound();
	}

	return (
		<>
			<main className="flex-1 flex flex-col justify-end px-0 sm:px-8 py-8 relative min-h-screen">
				<section className="flex-1 flex flex-col justify-end gap-0 max-w-2xl mx-auto w-full pb-24">
					<div className="flex flex-col">
						{renderMessagesWithDividers()}
						<div ref={messagesEndRef} />
					</div>
				</section>
				<GroupInputArea
					onSendMessage={handleSendMessage}
					agentChatLoading={agentChatLoading}
				/>
			</main>
			<SidebarRight groupId={actualGroupId} />
		</>
	);
}
