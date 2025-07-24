"use client";

import { useState, useEffect } from "react";
import {
	db,
	dbHelpers,
	Message,
	User,
	Agent,
	Group,
	Session,
} from "../lib/database";

// Extended message type with sender details
export interface MessageWithDetails extends Message {
	reactions: { emoji: string; count: number }[];
	senderUser?: User;
	senderAgent?: Agent;
	session?: Session;
}

// Hook for getting all messages from all sessions in a group
export function useGroupMessages(groupId: string | null) {
	const [messages, setMessages] = useState<MessageWithDetails[]>([]);
	const [sessions, setSessions] = useState<Session[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!groupId) {
			setMessages([]);
			setSessions([]);
			setLoading(false);
			return;
		}

		const loadGroupMessages = async () => {
			try {
				setLoading(true);
				
				// Get all sessions for the group
				const allSessions = await db.sessions
					.where('group_id')
					.equals(groupId)
					.toArray();
				
				// Sort sessions by creation time
				const groupSessions = allSessions.sort((a, b) => a.created_at.getTime() - b.created_at.getTime());
				
				setSessions(groupSessions);

				if (groupSessions.length === 0) {
					setMessages([]);
					return;
				}

				// Get messages for all sessions
				const allMessages: MessageWithDetails[] = [];
				
				for (const session of groupSessions) {
					const sessionMessages = await dbHelpers.getMessagesWithReactions(session.id);
					
					// Enhance messages with sender details and session info
					const enhancedMessages = await Promise.all(
						sessionMessages.map(async (message) => {
							let senderUser: User | undefined;
							let senderAgent: Agent | undefined;
							
							if (message.sender_user_id) {
								senderUser = await db.users.get(message.sender_user_id);
							}
							if (message.sender_agent_id) {
								senderAgent = await db.agents.get(message.sender_agent_id);
							}
							
							return {
								...message,
								senderUser,
								senderAgent,
								session,
							};
						})
					);
					
					allMessages.push(...enhancedMessages);
				}
				
				// Sort all messages by creation time
				allMessages.sort((a, b) => a.created_at.getTime() - b.created_at.getTime());
				
				setMessages(allMessages);
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Failed to load group messages');
			} finally {
				setLoading(false);
			}
		};

		loadGroupMessages();

		// Set up live query to watch for changes in sessions and messages
		const subscription = Promise.all([
			db.sessions.where('group_id').equals(groupId).toArray(),
			db.messages.toArray()
		]).then(() => loadGroupMessages());

		return () => {
			// Cleanup if needed
		};
	}, [groupId]);

	const sendMessage = async (content: string, senderUserId?: string, senderAgentId?: string) => {
		if (!groupId) return;
		
		try {
			// Get current session or create one
			const currentSession = await dbHelpers.getCurrentSession(groupId);
			
			await dbHelpers.sendMessage({
				session_id: currentSession.id,
				sender_user_id: senderUserId,
				sender_agent_id: senderAgentId,
				content,
			});
			
			// Reload all messages
			const allSessions = await db.sessions
				.where('group_id')
				.equals(groupId)
				.toArray();
			
			const groupSessions = allSessions.sort((a, b) => a.created_at.getTime() - b.created_at.getTime());
			
			const allMessages: MessageWithDetails[] = [];
			
			for (const session of groupSessions) {
				const sessionMessages = await dbHelpers.getMessagesWithReactions(session.id);
				
				const enhancedMessages = await Promise.all(
					sessionMessages.map(async (message) => {
						let senderUser: User | undefined;
						let senderAgent: Agent | undefined;
						
						if (message.sender_user_id) {
							senderUser = await db.users.get(message.sender_user_id);
						}
						if (message.sender_agent_id) {
							senderAgent = await db.agents.get(message.sender_agent_id);
						}
						
						return {
							...message,
							senderUser,
							senderAgent,
							session,
						};
					})
				);
				
				allMessages.push(...enhancedMessages);
			}
			
			allMessages.sort((a, b) => a.created_at.getTime() - b.created_at.getTime());
			setMessages(allMessages);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to send message');
		}
	};

	const addReaction = async (messageId: string, emoji: string, userId?: string, agentId?: string) => {
		try {
			await dbHelpers.addReaction({
				message_id: messageId,
				emoji,
				user_id: userId,
				agent_id: agentId,
			});
			
			// Reload all messages
			if (groupId) {
				const allSessions = await db.sessions
					.where('group_id')
					.equals(groupId)
					.toArray();
				
				const groupSessions = allSessions.sort((a, b) => a.created_at.getTime() - b.created_at.getTime());
				
				const allMessages: MessageWithDetails[] = [];
				
				for (const session of groupSessions) {
					const sessionMessages = await dbHelpers.getMessagesWithReactions(session.id);
					
					const enhancedMessages = await Promise.all(
						sessionMessages.map(async (message) => {
							let senderUser: User | undefined;
							let senderAgent: Agent | undefined;
							
							if (message.sender_user_id) {
								senderUser = await db.users.get(message.sender_user_id);
							}
							if (message.sender_agent_id) {
								senderAgent = await db.agents.get(message.sender_agent_id);
							}
							
							return {
								...message,
								senderUser,
								senderAgent,
								session,
							};
						})
					);
					
					allMessages.push(...enhancedMessages);
				}
				
				allMessages.sort((a, b) => a.created_at.getTime() - b.created_at.getTime());
				setMessages(allMessages);
			}
		} catch (err) {
			// If the reaction was removed (toggle behavior), reload messages
			if (err instanceof Error && err.message === 'Reaction removed') {
				if (groupId) {
					// Same reload logic as above
					const allSessions = await db.sessions
						.where('group_id')
						.equals(groupId)
						.toArray();
					
					const groupSessions = allSessions.sort((a, b) => a.created_at.getTime() - b.created_at.getTime());
					
					const allMessages: MessageWithDetails[] = [];
					
					for (const session of groupSessions) {
						const sessionMessages = await dbHelpers.getMessagesWithReactions(session.id);
						
						const enhancedMessages = await Promise.all(
							sessionMessages.map(async (message) => {
								let senderUser: User | undefined;
								let senderAgent: Agent | undefined;
								
								if (message.sender_user_id) {
									senderUser = await db.users.get(message.sender_user_id);
								}
								if (message.sender_agent_id) {
									senderAgent = await db.agents.get(message.sender_agent_id);
								}
								
								return {
									...message,
									senderUser,
									senderAgent,
									session,
								};
							})
						);
						
						allMessages.push(...enhancedMessages);
					}
					
					allMessages.sort((a, b) => a.created_at.getTime() - b.created_at.getTime());
					setMessages(allMessages);
				}
			} else {
				setError(err instanceof Error ? err.message : 'Failed to add reaction');
			}
		}
	};

	return {
		messages,
		sessions,
		loading,
		error,
		sendMessage,
		addReaction,
	};
}

// Hook for getting messages with reactions for a session
export function useSessionMessages(sessionId: string | null) {
	const [messages, setMessages] = useState<MessageWithDetails[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!sessionId) {
			setMessages([]);
			setLoading(false);
			return;
		}

		const loadMessages = async () => {
			try {
				setLoading(true);
				const messagesWithReactions = await dbHelpers.getMessagesWithReactions(sessionId);
				
				// Enhance messages with sender details
				const enhancedMessages = await Promise.all(
					messagesWithReactions.map(async (message) => {
						let senderUser: User | undefined;
						let senderAgent: Agent | undefined;
						
						if (message.sender_user_id) {
							senderUser = await db.users.get(message.sender_user_id);
						}
						if (message.sender_agent_id) {
							senderAgent = await db.agents.get(message.sender_agent_id);
						}
						
						return {
							...message,
							senderUser,
							senderAgent,
						};
					})
				);
				
				setMessages(enhancedMessages);
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Failed to load messages');
			} finally {
				setLoading(false);
			}
		};

		loadMessages();

		// Set up live query to watch for changes
		const subscription = db.messages
			.where('session_id')
			.equals(sessionId)
			.toArray()
			.then(() => loadMessages()); // Reload when messages change

		return () => {
			// Cleanup if needed
		};
	}, [sessionId]);

	const sendMessage = async (content: string, senderUserId?: string, senderAgentId?: string) => {
		if (!sessionId) return;
		
		try {
			await dbHelpers.sendMessage({
				session_id: sessionId,
				sender_user_id: senderUserId,
				sender_agent_id: senderAgentId,
				content,
			});
			// Reload messages
			const messagesWithReactions = await dbHelpers.getMessagesWithReactions(sessionId);
			
			// Enhance messages with sender details
			const enhancedMessages = await Promise.all(
				messagesWithReactions.map(async (message) => {
					let senderUser: User | undefined;
					let senderAgent: Agent | undefined;
					
					if (message.sender_user_id) {
						senderUser = await db.users.get(message.sender_user_id);
					}
					if (message.sender_agent_id) {
						senderAgent = await db.agents.get(message.sender_agent_id);
					}
					
					return {
						...message,
						senderUser,
						senderAgent,
					};
				})
			);
			
			setMessages(enhancedMessages);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to send message');
		}
	};

	const addReaction = async (messageId: string, emoji: string, userId?: string, agentId?: string) => {
		try {
			await dbHelpers.addReaction({
				message_id: messageId,
				emoji,
				user_id: userId,
				agent_id: agentId,
			});
			// Reload messages to update reactions
			if (sessionId) {
				const messagesWithReactions = await dbHelpers.getMessagesWithReactions(sessionId);
				
				// Enhance messages with sender details
				const enhancedMessages = await Promise.all(
					messagesWithReactions.map(async (message) => {
						let senderUser: User | undefined;
						let senderAgent: Agent | undefined;
						
						if (message.sender_user_id) {
							senderUser = await db.users.get(message.sender_user_id);
						}
						if (message.sender_agent_id) {
							senderAgent = await db.agents.get(message.sender_agent_id);
						}
						
						return {
							...message,
							senderUser,
							senderAgent,
						};
					})
				);
				
				setMessages(enhancedMessages);
			}
		} catch (err) {
			// If the reaction was removed (toggle behavior), reload messages
			if (err instanceof Error && err.message === 'Reaction removed') {
				if (sessionId) {
					const messagesWithReactions = await dbHelpers.getMessagesWithReactions(sessionId);
					
					// Enhance messages with sender details
					const enhancedMessages = await Promise.all(
						messagesWithReactions.map(async (message) => {
							let senderUser: User | undefined;
							let senderAgent: Agent | undefined;
							
							if (message.sender_user_id) {
								senderUser = await db.users.get(message.sender_user_id);
							}
							if (message.sender_agent_id) {
								senderAgent = await db.agents.get(message.sender_agent_id);
							}
							
							return {
								...message,
								senderUser,
								senderAgent,
							};
						})
					);
					
					setMessages(enhancedMessages);
				}
			} else {
				setError(err instanceof Error ? err.message : 'Failed to add reaction');
			}
		}
	};

	return {
		messages,
		loading,
		error,
		sendMessage,
		addReaction,
	};
}

// Hook for getting or creating a session for a group
export function useGroupSession(groupId: string | null) {
	const [session, setSession] = useState<Session | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!groupId) {
			setSession(null);
			setLoading(false);
			return;
		}

		const loadSession = async () => {
			try {
				setLoading(true);
				const currentSession = await dbHelpers.getCurrentSession(groupId);
				setSession(currentSession);
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Failed to load session');
			} finally {
				setLoading(false);
			}
		};

		loadSession();
	}, [groupId]);

	return {
		session,
		loading,
		error,
	};
}

// Hook for getting group details
export function useGroup(groupId: string | null) {
	const [group, setGroup] = useState<Group | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!groupId) {
			setGroup(null);
			setLoading(false);
			return;
		}

		const loadGroup = async () => {
			try {
				setLoading(true);
				const groupData = await db.groups.get(groupId);
				setGroup(groupData || null);
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Failed to load group');
			} finally {
				setLoading(false);
			}
		};

		loadGroup();
	}, [groupId]);

	return {
		group,
		loading,
		error,
	};
}

// Hook for getting group members
export function useGroupMembers(groupId: string | null) {
	const [members, setMembers] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!groupId) {
			setMembers([]);
			setLoading(false);
			return;
		}

		const loadMembers = async () => {
			try {
				setLoading(true);
				const groupMembers = await dbHelpers.getGroupMembersWithDetails(groupId);
				setMembers(groupMembers);
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Failed to load group members');
			} finally {
				setLoading(false);
			}
		};

		loadMembers();
	}, [groupId]);

	return {
		members,
		loading,
		error,
	};
}

// Hook for getting current user (we'll use the first user for now)
export function useCurrentUser() {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const loadUser = async () => {
			try {
				setLoading(true);
				// For now, get the first user - in a real app, this would come from auth
				const users = await db.users.toArray();
				if (users.length > 0) {
					setUser(users[0]);
				}
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Failed to load user');
			} finally {
				setLoading(false);
			}
		};

		loadUser();
	}, []);

	return {
		user,
		loading,
		error,
	};
}
