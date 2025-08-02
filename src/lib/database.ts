import Dexie, { Table } from "dexie";
import { v4 as uuidv4 } from "uuid";

// Types based on database schema
export interface User {
	id: string;
	name: string;
	email: string;
	avatar_url?: string;
	created_at: Date;
	updated_at: Date;
}

export interface Agent {
	id?: number; // Auto-incremental ID (optional for creation, required after)
	name: string;
	title: string;
	system_prompt: string;
	model: string; // e.g., gpt-4, claude-3, etc.
	temperature: number;
	max_output_tokens: number;
	avatar_url?: string;
	created_at: Date;
	updated_at: Date;
}

export interface Group {
	id: string;
	name: string;
	description?: string;
	created_by: string; // FK → Users.id
	created_at: Date;
	updated_at: Date;
}

export interface GroupMember {
	id: string;
	group_id: string; // FK → Groups.id
	user_id?: string; // nullable, FK → Users.id
	agent_id?: number; // nullable, FK → Agents.id (now only number)
	role: "human" | "agent";
	status: "active" | "muted";
	joined_at: Date;
	left_at?: Date; // nullable
}

export interface Session {
	id: string;
	group_id: string; // FK → Groups.id
	name?: string; // optional, for context labeling
	context?: any; // JSON, for storing context window, summary, etc.
	created_at: Date;
	ended_at?: Date; // nullable
}

export interface Message {
	id: string;
	session_id: string; // FK → Sessions.id
	sender_id: string; // Can be User.id or Agent.id (as string)
	sender_type: "user" | "agent";
	content: string;
	created_at: Date;
	edited_at?: Date; // nullable
	reply_to_id?: string; // nullable, FK → Messages.id
	type: "public" | "dm"; // public: group chat, dm: direct message
	dm_target_id?: string; // nullable, FK → Users.id or Agent.id
}

export interface MessageReaction {
	id: string;
	message_id: string; // FK → Messages.id
	reactor_id: string; // Can be User.id or Agent.id (as string)
	reactor_type: "user" | "agent";
	emoji: string; // e.g., "👍", "😂"
	created_at: Date;
}

// Database class
export class NakaChatDB extends Dexie {
	users!: Table<User>;
	agents!: Table<Agent>;
	groups!: Table<Group>;
	groupMembers!: Table<GroupMember>;
	sessions!: Table<Session>;
	messages!: Table<Message>;
	messageReactions!: Table<MessageReaction>;

	constructor() {
		// create a new instance of Dexie with a name
		super("NakaChatDB");

		this.version(1).stores({
			users: "id, name, email, created_at",
			agents: "id, name, model, created_at",
			groups: "id, name, created_by, created_at",
			groupMembers: "id, group_id, user_id, agent_id, role, status, joined_at",
			sessions: "id, group_id, created_at",
			messages: "id, session_id, sender_user_id, sender_agent_id, created_at",
			messageReactions: "id, message_id, user_id, agent_id, created_at",
		});

		this.version(2)
			.stores({
				users: "id, name, email, created_at",
				agents: "id, name, model, created_at",
				groups: "id, name, created_by, created_at",
				groupMembers:
					"id, group_id, user_id, agent_id, role, status, joined_at",
				sessions: "id, group_id, created_at",
				messages:
					"id, session_id, sender_user_id, sender_agent_id, created_at, type, dm_target_id",
				messageReactions: "id, message_id, user_id, agent_id, created_at",
			})
			.upgrade((tx) => {
				// Migrate existing messages to have type field
				return tx
					.table("messages")
					.toCollection()
					.modify((message) => {
						if (!message.type) {
							message.type = "public";
						}
					});
			});

		// Version 3: Change agent ID to auto-incremental and clear existing data
		this.version(3)
			.stores({
				users: "id, name, email, created_at",
				agents: "++id, name, model, created_at", // ++id makes it auto-incremental
				groups: "id, name, created_by, created_at",
				groupMembers:
					"id, group_id, user_id, agent_id, role, status, joined_at",
				sessions: "id, group_id, created_at",
				messages:
					"id, session_id, sender_user_id, sender_agent_id, created_at, type, dm_target_id",
				messageReactions: "id, message_id, user_id, agent_id, created_at",
			})
			.upgrade(async (tx) => {
				// Clear all existing data that references agents to avoid foreign key issues
				await tx.table("messageReactions").clear();
				await tx.table("messages").clear();
				await tx.table("groupMembers").clear();
				await tx.table("sessions").clear();
				await tx.table("agents").clear();
				console.log("Cleared existing agent-related data for schema migration");
			});

		// Version 4: Refactor messages to use sender_id and sender_type
		this.version(4)
			.stores({
				users: "id, name, email, created_at",
				agents: "++id, name, model, created_at",
				groups: "id, name, created_by, created_at",
				groupMembers:
					"id, group_id, user_id, agent_id, role, status, joined_at",
				sessions: "id, group_id, created_at",
				messages:
					"id, session_id, sender_id, sender_type, created_at, type, dm_target_id",
				messageReactions:
					"id, message_id, reactor_id, reactor_type, created_at",
			})
			.upgrade(async (tx) => {
				// Migrate existing messages to new structure
				const messages = await tx.table("messages").toArray();

				for (const message of messages) {
					if (message.sender_user_id) {
						message.sender_id = message.sender_user_id;
						message.sender_type = "user";
					} else if (message.sender_agent_id) {
						message.sender_id = message.sender_agent_id.toString();
						message.sender_type = "agent";
					}

					// Remove old fields
					delete message.sender_user_id;
					delete message.sender_agent_id;
				}

				// Update message reactions similarly
				const reactions = await tx.table("messageReactions").toArray();

				for (const reaction of reactions) {
					if (reaction.user_id) {
						reaction.reactor_id = reaction.user_id;
						reaction.reactor_type = "user";
					} else if (reaction.agent_id) {
						reaction.reactor_id = reaction.agent_id.toString();
						reaction.reactor_type = "agent";
					}

					// Remove old fields
					delete reaction.user_id;
					delete reaction.agent_id;
				}

				console.log("Migrated messages and reactions to new sender structure");
			});
	}
}

export const db = new NakaChatDB();

// Initialize database with auto-seeding if needed
export async function initializeDatabase() {
	try {
		// Import dynamically to avoid circular dependency
		const { isDatabaseSeeded, seedDatabase } = await import("./seedData");

		const isSeeded = await isDatabaseSeeded();
		if (!isSeeded) {
			console.log("Database is empty, auto-seeding...");
			await seedDatabase();
			console.log("Database initialized and seeded successfully!");
		} else {
			console.log("Database already initialized");
		}
	} catch (error) {
		console.error("Error initializing database:", error);
		throw error;
	}
}

// Helper functions for database operations
export const dbHelpers = {
	// Create a new user
	async createUser(
		userData: Omit<User, "id" | "created_at" | "updated_at">
	): Promise<User> {
		const now = new Date();
		const user: User = {
			id: uuidv4(),
			...userData,
			created_at: now,
			updated_at: now,
		};
		await db.users.add(user);
		return user;
	},

	// Create a new agent with auto-incremental ID
	async createAgent(
		agentData: Omit<Agent, "id" | "created_at" | "updated_at">
	): Promise<Agent> {
		const now = new Date();
		const agentToCreate = {
			...agentData,
			created_at: now,
			updated_at: now,
		};
		// Let Dexie auto-generate the incremental ID
		const id = await db.agents.add(agentToCreate);
		return {
			...agentToCreate,
			id: id as number,
		};
	},

	// Create a new group
	async createGroup(
		groupData: Omit<Group, "id" | "created_at" | "updated_at">
	): Promise<Group> {
		const now = new Date();
		const group: Group = {
			id: uuidv4(),
			...groupData,
			created_at: now,
			updated_at: now,
		};
		await db.groups.add(group);
		return group;
	},

	// Update group details (name, description, etc.)
	async updateGroup(
		groupId: string,
		updates: Partial<Pick<Group, "name" | "description">>
	): Promise<void> {
		await db.groups.update(groupId, {
			...updates,
			updated_at: new Date(),
		});
	},

	// Delete a group and all its related data
	async deleteGroup(groupId: string): Promise<void> {
		// Delete all related data in the correct order to maintain referential integrity

		// 1. Delete message reactions for all messages in all sessions of this group
		const sessions = await db.sessions
			.where("group_id")
			.equals(groupId)
			.toArray();
		for (const session of sessions) {
			const messages = await db.messages
				.where("session_id")
				.equals(session.id)
				.toArray();
			for (const message of messages) {
				await db.messageReactions
					.where("message_id")
					.equals(message.id)
					.delete();
			}
		}

		// 2. Delete all messages in all sessions of this group
		for (const session of sessions) {
			await db.messages.where("session_id").equals(session.id).delete();
		}

		// 3. Delete all sessions for this group
		await db.sessions.where("group_id").equals(groupId).delete();

		// 4. Delete all group members
		await db.groupMembers.where("group_id").equals(groupId).delete();

		// 5. Finally, delete the group itself
		await db.groups.delete(groupId);
	},

	// Add member to group
	async addGroupMember(
		memberData: Omit<GroupMember, "id" | "joined_at">
	): Promise<GroupMember> {
		const member: GroupMember = {
			id: uuidv4(),
			...memberData,
			joined_at: new Date(),
		};
		await db.groupMembers.add(member);
		return member;
	},

	// Create a new session
	async createSession(
		sessionData: Omit<Session, "id" | "created_at">
	): Promise<Session> {
		const session: Session = {
			id: uuidv4(),
			...sessionData,
			created_at: new Date(),
		};
		await db.sessions.add(session);
		return session;
	},

	// Send a message
	async sendMessage(
		messageData: Omit<Message, "id" | "created_at">
	): Promise<Message> {
		const message: Message = {
			id: uuidv4(),
			...messageData,
			type: messageData.type || "public", // Default to public if not specified
			created_at: new Date(),
		};
		await db.messages.add(message);
		return message;
	},

	// Send a DM message
	async sendDMMessage(
		sessionId: string,
		senderId: string,
		senderType: "user" | "agent",
		content: string,
		dmTargetId: string
	): Promise<Message> {
		return this.sendMessage({
			session_id: sessionId,
			sender_id: senderId,
			sender_type: senderType,
			content,
			type: "dm",
			dm_target_id: dmTargetId,
		});
	},

	// Add a reaction to a message
	async addReaction(
		reactionData: Omit<MessageReaction, "id" | "created_at">
	): Promise<MessageReaction> {
		// Check if reaction already exists
		const existing = await db.messageReactions
			.where(["message_id", "emoji", "reactor_id", "reactor_type"])
			.equals([
				reactionData.message_id,
				reactionData.emoji,
				reactionData.reactor_id,
				reactionData.reactor_type,
			])
			.first();

		if (existing) {
			// Remove existing reaction (toggle behavior)
			await db.messageReactions.delete(existing.id);
			throw new Error("Reaction removed");
		}

		const reaction: MessageReaction = {
			id: uuidv4(),
			...reactionData,
			created_at: new Date(),
		};
		await db.messageReactions.add(reaction);
		return reaction;
	},

	// Get messages for a session with reactions
	async getMessagesWithReactions(
		sessionId: string
	): Promise<(Message & { reactions: { emoji: string; count: number }[] })[]> {
		const messages = await db.messages
			.where("session_id")
			.equals(sessionId)
			.toArray();

		const messagesWithReactions = await Promise.all(
			messages.map(async (message) => {
				const reactions = await db.messageReactions
					.where("message_id")
					.equals(message.id)
					.toArray();

				// Group reactions by emoji and count them
				const reactionCounts = reactions.reduce(
					(acc, reaction) => {
						acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
						return acc;
					},
					{} as Record<string, number>
				);

				const reactionArray = Object.entries(reactionCounts).map(
					([emoji, count]) => ({
						emoji,
						count,
					})
				);

				return {
					...message,
					reactions: reactionArray,
				};
			})
		);

		return messagesWithReactions;
	},

	// Get DM messages between two users in a group
	async getDMMessages(
		groupId: string,
		userId1: string,
		userId2: string
	): Promise<(Message & { reactions: { emoji: string; count: number }[] })[]> {
		// Get all sessions for the group
		const sessions = await db.sessions
			.where("group_id")
			.equals(groupId)
			.toArray();

		const allDMMessages: (Message & {
			reactions: { emoji: string; count: number }[];
		})[] = [];

		// Get DM messages from all sessions
		for (const session of sessions) {
			const sessionMessages = await db.messages
				.where("session_id")
				.equals(session.id)
				.and((msg) => msg.type === "dm")
				.toArray();

			// Filter messages between the two users
			const relevantDMs = sessionMessages.filter((msg) => {
				const isFromUser1 = msg.sender_id == userId1;
				const isToUser1 = msg.dm_target_id == userId1;
				const isFromUser2 = msg.sender_id == userId2;
				const isToUser2 = msg.dm_target_id == userId2;

				return (isFromUser1 && isToUser2) || (isFromUser2 && isToUser1);
			});

			// Add reactions to messages
			const messagesWithReactions = await Promise.all(
				relevantDMs.map(async (message) => {
					const reactions = await db.messageReactions
						.where("message_id")
						.equals(message.id)
						.toArray();

					const reactionCounts = reactions.reduce(
						(acc, reaction) => {
							acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
							return acc;
						},
						{} as Record<string, number>
					);

					const reactionArray = Object.entries(reactionCounts).map(
						([emoji, count]) => ({
							emoji,
							count,
						})
					);

					return {
						...message,
						reactions: reactionArray,
					};
				})
			);

			allDMMessages.push(...messagesWithReactions);
		}

		// Sort by creation time
		allDMMessages.sort(
			(a, b) => a.created_at.getTime() - b.created_at.getTime()
		);
		return allDMMessages;
	},

	// Get group members with user/agent details
	async getGroupMembersWithDetails(groupId: string) {
		const members = await db.groupMembers
			.where("group_id")
			.equals(groupId)
			.and((member) => member.status === "active")
			.toArray();

		const membersWithDetails = await Promise.all(
			members.map(async (member) => {
				let details = null;
				if (member.user_id) {
					details = await db.users.get(member.user_id);
				} else if (member.agent_id) {
					details = await db.agents.get(member.agent_id);
				}
				return {
					...member,
					details,
				};
			})
		);

		return membersWithDetails;
	},

	// Get current session for a group (or create one)
	async getCurrentSession(groupId: string): Promise<Session> {
		// Try to find an active session (not ended)
		let session = await db.sessions
			.where("group_id")
			.equals(groupId)
			.and((s) => !s.ended_at)
			.first();

		if (!session) {
			// Create a new session
			session = await this.createSession({
				group_id: groupId,
				name: "Default Session",
			});
		}

		return session;
	},

	// Update user details (e.g., name)
	async updateUser(
		userId: string,
		updates: Partial<Pick<User, "name" | "avatar_url" | "email">>
	): Promise<void> {
		await db.users.update(userId, {
			...updates,
			updated_at: new Date(),
		});
	},

	// Update agent details (e.g., name)
	async updateAgent(
		agentId: number,
		updates: Partial<
			Pick<
				Agent,
				| "name"
				| "avatar_url"
				| "title"
				| "system_prompt"
				| "model"
				| "temperature"
				| "max_output_tokens"
			>
		>
	): Promise<void> {
		await db.agents.update(agentId, {
			...updates,
			updated_at: new Date(),
		});
	},

	// Delete an agent and all related data
	async deleteAgent(agentId: number): Promise<void> {
		// Delete all related data in the correct order to avoid foreign key constraints

		// 1. Delete message reactions for messages sent by this agent
		await db.messageReactions
			.where("reactor_id")
			.equals(agentId.toString())
			.and((r) => r.reactor_type === "agent")
			.delete();

		// 2. Delete messages sent by this agent
		await db.messages
			.where("sender_id")
			.equals(agentId.toString())
			.and((m) => m.sender_type === "agent")
			.delete();

		// 3. Delete group memberships for this agent
		await db.groupMembers.where("agent_id").equals(agentId).delete();

		// 4. Finally delete the agent
		await db.agents.delete(agentId);
	},

	// Reset the entire database - removes all data
	async resetDatabase(): Promise<void> {
		try {
			// Clear all tables in the correct order to maintain referential integrity
			console.log("Resetting database...");

			// 1. Delete message reactions first (no foreign keys pointing to them)
			await db.messageReactions.clear();

			// 2. Delete messages (referenced by reactions)
			await db.messages.clear();

			// 3. Delete sessions (referenced by messages)
			await db.sessions.clear();

			// 4. Delete group members (no foreign keys pointing to them)
			await db.groupMembers.clear();

			// 5. Delete groups (referenced by group members and sessions)
			await db.groups.clear();

			// 6. Delete agents (referenced by group members and messages)
			await db.agents.clear();

			// 7. Delete users (referenced by group members and messages)
			await db.users.clear();

			console.log("Database reset successfully!");
		} catch (error) {
			console.error("Error resetting database:", error);
			throw error;
		}
	},

	// Delete the entire database completely
	async deleteDatabase(): Promise<void> {
		try {
			console.log("Deleting database completely...");

			// Close the database connection
			await db.close();

			// Delete the database from IndexedDB
			await Dexie.delete("NakaChatDB");

			console.log("Database deleted successfully!");
		} catch (error) {
			console.error("Error deleting database:", error);
			throw error;
		}
	},
};

// Clean message type with sender details for UI rendering
export interface MessageWithDetails {
	id: string;
	content: string;
	created_at: Date;
	edited_at?: Date;
	type: "public" | "dm";
	dm_target_id?: string; // needed for DM logic in UI
	reply_to_id?: string; // might be needed for reply functionality
	reactions: { emoji: string; count: number }[];
	sender?: User | Agent;
	recipient?: User | Agent; // For DM messages, the target user/agent
	session?: Session;
}

// Singleton for database initialization
let dbInitPromise: Promise<void> | null = null;
export function initializeDatabaseOnce() {
	if (!dbInitPromise) {
		dbInitPromise = initializeDatabase();
	}
	return dbInitPromise;
}
