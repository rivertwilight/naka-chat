import { dbHelpers, Agent, MessageWithDetails, db } from "./database";
import { ProviderConfig } from "./aiUtils";

export const AGENT_CONFIG = {
	RESPONSE_DELAY: {
		MIN_MS: 1000,
		MAX_MS: 10000,
	},
	TYPING_POOL: {
		MAX_CONCURRENT: 4,
	},
	SUPERVISOR: {
		DEBOUNCE_DELAY_MS: 3000, // 3 seconds idle time before triggering supervision
		DECISION_RETRY_DELAY_MS: 1000,
		POST_RESPONSE_DELAY_MS: 500,
	},
	RESPONSE_LIMITS: {
		MAX_WORDS: 150,
		MAX_CHINESE_CHARS: 50,
	},
} as const;

export interface GroupChatMember {
	id: string;
	name: string;
	title: string;
	role: "human" | "agent";
	system_prompt?: string;
	model?: string;
	temperature?: number;
	max_output_tokens?: number;
}

export interface SupervisorDecision {
	nextSpeaker: string[];
	reasoning: string;
}

export interface ConversationContext {
	groupId: string;
	groupName: string;
	groupDescription: string;
	members: GroupChatMember[];
	history: string;
}

// Service Classes
class MemberService {
	constructor(private groupId: string) {}

	async getGroupMembers(): Promise<GroupChatMember[]> {
		const membersWithDetails = await dbHelpers.getGroupMembersWithDetails(
			this.groupId
		);

		return membersWithDetails.map((member) => {
			if (member.role === "human" && member.details) {
				return {
					id: member.user_id!,
					name: member.details.name,
					title: "Human User",
					role: "human" as const,
				};
			}

			if (member.role === "agent" && member.details) {
				const agentDetails = member.details as Agent;
				return {
					id: member.agent_id!,
					name: agentDetails.name,
					title: agentDetails.title,
					role: "agent" as const,
					system_prompt: agentDetails.system_prompt,
					model: agentDetails.model,
					temperature: agentDetails.temperature,
					max_output_tokens: agentDetails.max_output_tokens,
				};
			}

			throw new Error("Invalid member data");
		});
	}

	getAvailableAgents(
		members: GroupChatMember[],
		typingPool: Set<string>
	): GroupChatMember[] {
		return members.filter(
			(m) => m.role === "agent" && !typingPool.has(m.id)
		);
	}

	findMembersByIdentifiers(
		members: GroupChatMember[],
		identifiers: string[]
	): GroupChatMember[] {
		return identifiers
			.map((identifier) =>
				members.find(
					(m) =>
						(m.name === identifier || m.id === identifier) &&
						m.role === "agent"
				)
			)
			.filter(Boolean) as GroupChatMember[];
	}
}

class ConversationService {
	formatHistory(
		messages: MessageWithDetails[],
		agentId?: string,
		isSupervisor?: boolean
	): string {
		// Sort messages by created_at ascending (oldest first)
		const sortedMessages = [...messages].sort((a, b) => {
			const aTime =
				a.created_at instanceof Date
					? a.created_at.getTime()
					: new Date(a.created_at).getTime();
			const bTime =
				b.created_at instanceof Date
					? b.created_at.getTime()
					: new Date(b.created_at).getTime();
			return aTime - bTime;
		});
		return sortedMessages
			.filter((msg) => {
				if (isSupervisor) return true;
				if (msg.type !== "dm") return true;
				if (!agentId) return false;
				const isSender =
					msg.senderAgent && msg.senderAgent.id === agentId;
				const isTarget = msg.dm_target_id === agentId;
				return isSender || isTarget;
			})
			.map((msg) => {
				const sender =
					msg.senderUser?.name || msg.senderAgent?.name || "Unknown";
				return `${sender}: ${msg.content}`;
			})
			.join("\n");
	}

	async getLatestSessionMessages(
		groupId: string,
		agentId?: string,
		isSupervisor?: boolean
	): Promise<MessageWithDetails[]> {
		const currentSession = await dbHelpers.getCurrentSession(groupId);
		const sessionMessages = await dbHelpers.getMessagesWithReactions(
			currentSession.id
		);

		const enhancedMessages = await Promise.all(
			sessionMessages.map(async (message) => {
				const senderUser = message.sender_user_id
					? await db.users.get(message.sender_user_id)
					: undefined;
				const senderAgent = message.sender_agent_id
					? await db.agents.get(message.sender_agent_id)
					: undefined;

				return {
					...message,
					senderUser,
					senderAgent,
					session: currentSession,
				};
			})
		);

		return enhancedMessages.filter((msg) => {
			if (isSupervisor) return true;
			if (msg.type !== "dm") return true;
			if (!agentId) return false;
			const isSender = msg.senderAgent && msg.senderAgent.id === agentId;
			const isTarget = msg.dm_target_id === agentId;
			return isSender || isTarget;
		});
	}

	createConversationContext(
		groupId: string,
		groupName: string,
		groupDescription: string,
		members: GroupChatMember[],
		messages: MessageWithDetails[],
		agentId?: string,
		isSupervisor?: boolean
	): ConversationContext {
		return {
			groupId,
			groupName,
			groupDescription,
			members,
			history: this.formatHistory(messages, agentId, isSupervisor),
		};
	}
}

class SupervisorService {
	constructor(private providerConfig: ProviderConfig) {}

	async makeDecision(
		context: ConversationContext,
		availableMembers: GroupChatMember[]
	): Promise<SupervisorDecision> {
		try {
			const response = await fetch("/api/supervisor-decision", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					context,
					availableMembers,
					providerConfig: this.providerConfig,
				}),
			});

			if (!response.ok) {
				throw new Error(`API request failed: ${response.statusText}`);
			}

			const decision = (await response.json()) as SupervisorDecision;
			return decision;
		} catch (error) {
			console.error("Supervisor decision error:", error);
			return this.createFallbackDecision();
		}
	}

	private createFallbackDecision(): SupervisorDecision {
		return {
			nextSpeaker: ["human"],
			reasoning:
				"Error in supervisor decision, defaulting to human input",
		};
	}
}

class AgentResponseService {
	constructor(private providerConfig: ProviderConfig) {}

	async generateResponse(
		agent: GroupChatMember,
		context: ConversationContext
	): Promise<string> {
		if (agent.role !== "agent") {
			throw new Error("Cannot generate response for non-agent member");
		}

		try {
			const response = await fetch("/api/agent-response", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					agent,
					context,
					providerConfig: this.providerConfig,
				}),
			});

			if (!response.ok) {
				throw new Error(`API request failed: ${response.statusText}`);
			}

			const result = await response.json();
			return result.response;
		} catch (error) {
			console.error("Agent response generation error:", error);
			return `*${agent.name} is having trouble responding right now. Please try again later.*`;
		}
	}
}

class AgentTypingPool {
	private pool = new Set<string>();

	add(agentId: string): void {
		this.pool.add(agentId);
	}

	remove(agentId: string): void {
		this.pool.delete(agentId);
	}

	has(agentId: string): boolean {
		return this.pool.has(agentId);
	}

	get size(): number {
		return this.pool.size;
	}

	getAvailableSlots(): number {
		return AGENT_CONFIG.TYPING_POOL.MAX_CONCURRENT - this.size;
	}

	canAddMore(): boolean {
		return this.getAvailableSlots() > 0;
	}

	clear(): void {
		this.pool.clear();
	}

	// Add public getter for the pool
	get typingAgents(): Set<string> {
		return this.pool;
	}
}

/**
 * Organize a group chat with AI agents.
 */
export class AgentGroupChat {
	private memberService: MemberService;
	private conversationService: ConversationService;
	private supervisorService: SupervisorService;
	private responseService: AgentResponseService;
	private typingPool = new AgentTypingPool();
	private isSupervisorActive = false;
	private debounceTimeout: NodeJS.Timeout | null = null;
	private isMonitoring = false;
	private lastMessageCount = 0;
	private monitoringInterval: NodeJS.Timeout | null = null;
	private onTypingChangeCallback?: (typingAgents: string[]) => void;

	public members: GroupChatMember[] = [];
	public groupName: string = "";
	public groupDescription: string = "";

	constructor(
		private groupId: string,
		private providerConfig: ProviderConfig
	) {
		this.memberService = new MemberService(groupId);
		this.conversationService = new ConversationService();
		this.supervisorService = new SupervisorService(providerConfig);
		this.responseService = new AgentResponseService(providerConfig);
	}

	// Public methods for external access
	async getGroupMembers(): Promise<GroupChatMember[]> {
		return this.memberService.getGroupMembers();
	}

	formatConversationHistory(messages: MessageWithDetails[]): string {
		return this.conversationService.formatHistory(messages);
	}

	/**
	 * Set callback to be notified when typing agents change
	 */
	setOnTypingChange(callback: (typingAgents: string[]) => void): void {
		this.onTypingChangeCallback = callback;
	}

	/**
	 * Get currently typing agent names
	 */
	getTypingAgents(): string[] {
		const typingAgentIds = Array.from(this.typingPool.typingAgents);
		return typingAgentIds.map((agentId) => {
			const member = this.members.find((m) => m.id === agentId);
			return member?.name || agentId;
		});
	}

	/**
	 * Start monitoring the group for new messages and automatically trigger supervision
	 */
	async startMonitoring(): Promise<void> {
		if (this.isMonitoring) return;

		this.isMonitoring = true;

		// Initialize group data
		const group = await db.groups.get(this.groupId);
		this.groupName = group?.name || "";
		this.groupDescription = group?.description || "";
		this.members = await this.memberService.getGroupMembers();

		// Get initial message count
		const messages =
			await this.conversationService.getLatestSessionMessages(
				this.groupId
			);
		this.lastMessageCount = messages.length;

		// Start monitoring for new messages
		this.monitoringInterval = setInterval(async () => {
			await this.checkForNewMessages();
		}, 1000); // Check every second

		console.log(`Started monitoring group ${this.groupId}`);
	}

	/**
	 * Stop monitoring the group
	 */
	stopMonitoring(): void {
		this.isMonitoring = false;

		if (this.monitoringInterval) {
			clearInterval(this.monitoringInterval);
			this.monitoringInterval = null;
		}

		if (this.debounceTimeout) {
			clearTimeout(this.debounceTimeout);
			this.debounceTimeout = null;
		}

		console.log(`Stopped monitoring group ${this.groupId}`);
	}

	/**
	 * Manually send a message (for external use, will trigger debounce)
	 */
	async sendUserMessage(content: string, userId: string): Promise<void> {
		// The message will be detected by the monitoring system and trigger debounce
		// This method is mainly for external integrations
	}

	private async checkForNewMessages(): Promise<void> {
		try {
			const messages =
				await this.conversationService.getLatestSessionMessages(
					this.groupId
				);
			const currentMessageCount = messages.length;

			// If there are new messages, reset the debounce timer
			if (currentMessageCount > this.lastMessageCount) {
				this.lastMessageCount = currentMessageCount;
				this.resetDebounceTimer();
			}
		} catch (error) {
			console.error("Error checking for new messages:", error);
		}
	}

	private resetDebounceTimer(): void {
		// Clear existing timer
		if (this.debounceTimeout) {
			clearTimeout(this.debounceTimeout);
		}

		// Set new timer
		this.debounceTimeout = setTimeout(async () => {
			await this.triggerSupervision();
		}, AGENT_CONFIG.SUPERVISOR.DEBOUNCE_DELAY_MS);
	}

	private async triggerSupervision(): Promise<void> {
		if (this.isSupervisorActive || !this.isMonitoring) {
			return;
		}

		this.isSupervisorActive = true;

		try {
			// Get latest data
			const messages =
				await this.conversationService.getLatestSessionMessages(
					this.groupId
				);
			const members = await this.memberService.getGroupMembers();

			// Run supervision loop
			await this.runSupervisorLoop(members, messages);
		} catch (error) {
			console.error("Error in supervision:", error);
		} finally {
			this.isSupervisorActive = false;
		}
	}

	private async runSupervisorLoop(
		members: GroupChatMember[],
		messages: MessageWithDetails[]
	): Promise<void> {
		while (true) {
			const availableAgents = this.memberService.getAvailableAgents(
				members,
				this.typingPool.typingAgents
			);
			const availableMembers = [
				...members.filter((m) => m.role === "human"),
				...availableAgents,
			];

			const context = this.conversationService.createConversationContext(
				this.groupId,
				this.groupName,
				this.groupDescription,
				members,
				messages,
				undefined,
				true
			);

			const decision = await this.supervisorService.makeDecision(
				context,
				availableMembers
			);
			console.log("Supervisor decision:", decision);

			// Stop if no agents to speak or only human should speak
			const agentsToSpeak = decision.nextSpeaker.filter(
				(speaker) => speaker !== "human"
			);
			if (
				decision.nextSpeaker.length === 0 ||
				agentsToSpeak.length === 0
			) {
				break;
			}

			const nextAgents = this.memberService.findMembersByIdentifiers(
				availableAgents,
				agentsToSpeak
			);

			if (nextAgents.length === 0) {
				console.error(
					"No available agents found:",
					decision.nextSpeaker
				);
				break;
			}

			if (!this.typingPool.canAddMore()) {
				await this.waitForAgentsToFinish();
				continue;
			}

			const agentsToStart = nextAgents.slice(
				0,
				this.typingPool.getAvailableSlots()
			);
			await this.processAgentResponses(agentsToStart, context);

			// Get updated messages from database for next iteration
			messages = await this.conversationService.getLatestSessionMessages(
				this.groupId,
				undefined,
				true
			);
			await this.delay(AGENT_CONFIG.SUPERVISOR.POST_RESPONSE_DELAY_MS);
		}
	}

	private async processAgentResponses(
		agents: GroupChatMember[],
		context: ConversationContext
	): Promise<void> {
		const isSingleAgent = agents.length === 1;
		const agentPromises = agents.map((agent) =>
			this.scheduleAgentResponse(agent, context, isSingleAgent)
		);
		await Promise.all(agentPromises);
	}

	private async scheduleAgentResponse(
		agent: GroupChatMember,
		context: ConversationContext,
		isSingleAgent: boolean = false
	): Promise<void> {
		const delay = isSingleAgent ? 500 : this.calculateResponseDelay(); // Minimal delay for single agent

		return new Promise<void>((resolve) => {
			setTimeout(async () => {
				try {
					this.typingPool.add(agent.id); // Mark as typing only when making the request
					this.notifyTypingChange();
					await this.executeAgentResponse(agent, context);
				} finally {
					this.typingPool.remove(agent.id);
					this.notifyTypingChange();
					resolve();
				}
			}, delay);
		});
	}

	private notifyTypingChange(): void {
		if (this.onTypingChangeCallback) {
			const typingAgentNames = this.getTypingAgents();
			this.onTypingChangeCallback(typingAgentNames);
		}
	}

	private async executeAgentResponse(
		agent: GroupChatMember,
		context: ConversationContext
	): Promise<void> {
		const latestMessages =
			await this.conversationService.getLatestSessionMessages(
				this.groupId,
				agent.id
			);
		const updatedContext =
			this.conversationService.createConversationContext(
				context.groupId,
				context.groupName,
				context.groupDescription,
				context.members,
				latestMessages,
				agent.id
			);

		const response = await this.responseService.generateResponse(
			agent,
			updatedContext
		);
		const currentSession = await dbHelpers.getCurrentSession(this.groupId);

		// Robustly parse JSON, handling code block wrappers
		let content = "";
		let type: "public" | "dm" = "public";
		let dm_target_id = undefined;
		try {
			let cleaned = response.trim();
			if (cleaned.startsWith("```")) {
				cleaned = cleaned.replace(/^```[a-zA-Z0-9]*\s*/, "");
				cleaned = cleaned.replace(/```\s*$/, "");
			}
			const parsed = JSON.parse(cleaned);
			if (typeof parsed === "object" && parsed.content) {
				content = parsed.content;
				if (parsed.target) {
					type = "dm";
					dm_target_id = parsed.target;
				}
			}
		} catch (e) {
			content = "[Invalid agent response: not valid JSON]";
		}

		await dbHelpers.sendMessage({
			session_id: currentSession.id,
			sender_agent_id: agent.id,
			content,
			type,
			...(dm_target_id ? { dm_target_id } : {}),
		});
	}

	private calculateResponseDelay(): number {
		const { MIN_MS, MAX_MS } = AGENT_CONFIG.RESPONSE_DELAY;
		return Math.floor(Math.random() * (MAX_MS - MIN_MS + 1)) + MIN_MS;
	}

	private async waitForAgentsToFinish(): Promise<void> {
		await this.delay(AGENT_CONFIG.SUPERVISOR.DECISION_RETRY_DELAY_MS);
	}

	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}
