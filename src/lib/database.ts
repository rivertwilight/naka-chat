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
	id: string;
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
	agent_id?: string; // nullable, FK → Agents.id
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
	sender_user_id?: string; // nullable, FK → Users.id
	sender_agent_id?: string; // nullable, FK → Agents.id
	content: string;
	created_at: Date;
	edited_at?: Date; // nullable
	reply_to_id?: string; // nullable, FK → Messages.id
}

export interface MessageReaction {
	id: string;
	message_id: string; // FK → Messages.id
	user_id?: string; // nullable, FK → Users.id
	agent_id?: string; // nullable, FK → Agents.id
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
			return true;
		}

		console.log("Database already initialized");
		return false;
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

	// Create a new agent
	async createAgent(
		agentData: Omit<Agent, "id" | "created_at" | "updated_at">
	): Promise<Agent> {
		const now = new Date();
		const agent: Agent = {
			id: uuidv4(),
			...agentData,
			created_at: now,
			updated_at: now,
		};
		await db.agents.add(agent);
		return agent;
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
			created_at: new Date(),
		};
		await db.messages.add(message);
		return message;
	},

	// Add a reaction to a message
	async addReaction(
		reactionData: Omit<MessageReaction, "id" | "created_at">
	): Promise<MessageReaction> {
		// Check if reaction already exists， be careful that the user_id or agent_id can be null
		const existing = await db.messageReactions
			.where(["message_id", "emoji", "user_id"])
			.equals([
				reactionData.message_id,
				reactionData.emoji,
				reactionData.user_id || "",
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

		console.log("getMessagesWithReactions: messages", messages, sessionId);

		const messagesWithReactions = await Promise.all(
			messages.map(async (message) => {
				const reactions = await db.messageReactions
					.where("message_id")
					.equals(message.id)
					.toArray();

				// Group reactions by emoji and count them
				const reactionCounts = reactions.reduce((acc, reaction) => {
					acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
					return acc;
				}, {} as Record<string, number>);

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
};

// Extended message type with sender details (re-export from useDatabase.ts)
export interface MessageWithDetails extends Message {
	reactions: { emoji: string; count: number }[];
	senderUser?: User;
	senderAgent?: Agent;
	session?: Session;
}

export { dbHelpers };
