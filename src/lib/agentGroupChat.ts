import { dbHelpers, Agent, MessageWithDetails, db } from "./database";
// Re-export types for external use
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText } from "ai";
export type { MessageWithDetails } from "./database";
import { GoogleGenAI } from "@google/genai";

// Configuration
export const AGENT_CONFIG = {
	RESPONSE_DELAY: {
		MIN_MS: 1000,
		MAX_MS: 120000
	},
	TYPING_POOL: {
		MAX_CONCURRENT: 4
	},
	SUPERVISOR: {
		IDLE_TIMEOUT_MS: 5000,
		DECISION_RETRY_DELAY_MS: 1000,
		POST_RESPONSE_DELAY_MS: 500
	},
	RESPONSE_LIMITS: {
		MAX_WORDS: 150,
		MAX_CHINESE_CHARS: 50
	}
} as const;

// Types and Interfaces
export interface ProviderConfig {
	provider: "Google" | "Anthropic" | "OpenAI" | "Custom";
	apiKey: string;
	baseUrl?: string;
	modelId?: string;
}

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
	shouldStop: boolean;
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
					role: "human" as const
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
					max_output_tokens: agentDetails.max_output_tokens
				};
			}

			throw new Error("Invalid member data");
		});
	}

	getAvailableAgents(
		members: GroupChatMember[],
		typingPool: Set<string>
	): GroupChatMember[] {
		return members.filter((m) => m.role === "agent" && !typingPool.has(m.id));
	}

	findMembersByIdentifiers(
		members: GroupChatMember[],
		identifiers: string[]
	): GroupChatMember[] {
		return identifiers
			.map((identifier) =>
				members.find(
					(m) =>
						(m.name === identifier || m.id === identifier) && m.role === "agent"
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
				const isSender = msg.senderAgent && msg.senderAgent.id === agentId;
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
					session: currentSession
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
			history: this.formatHistory(messages, agentId, isSupervisor)
		};
	}
}

class AICallService {
	constructor(private providerConfig: ProviderConfig) {}

	async callAI(prompt: string, modelId: string): Promise<string> {
		switch (this.providerConfig.provider) {
			case "Google":
				try {
					const ai = new GoogleGenAI({ apiKey: this.providerConfig.apiKey });
					const googleResponse = await ai.models.generateContent({
						model: modelId || "gemini-2.5-pro",
						contents: [{ role: "user", parts: [{ text: prompt }] }]
					});
					return googleResponse.text || "";
				} catch (error) {
					console.error("AI call error:", error);
					console.error(
						"Error message:",
						`*${this.providerConfig.provider} is having trouble responding right now. Please try again later.*`
					);
					return "";
				}
			case "OpenAI":
				throw new Error("OpenAI provider not implemented yet");
			case "Anthropic":
				throw new Error("Anthropic provider not implemented yet");
			case "Custom":
				try {
					const provider = createOpenAICompatible({
						name: "AI Hub Mix",
						baseURL: this.providerConfig.baseUrl!,
						apiKey: this.providerConfig.apiKey
					});
					const model = provider(modelId || "gpt-4o");
					const response = await generateText({
						model: model,
						prompt
					});
					return response.text || "";
				} catch (error) {
					console.error("AI call error:", error);
					console.error(
						"Error message:",
						`*${this.providerConfig.provider} is having trouble responding right now. Please try again later.*`
					);
					return "";
				}
			default:
				throw new Error(
					`Unsupported provider: ${this.providerConfig.provider}`
				);
		}
	}
}

class SupervisorService {
	private aiCallService: AICallService;
	constructor(private providerConfig: ProviderConfig) {
		this.aiCallService = new AICallService(providerConfig);
	}

	async makeDecision(
		context: ConversationContext,
		availableMembers: GroupChatMember[]
	): Promise<SupervisorDecision> {
		const prompt = this.buildSupervisorPrompt(context, availableMembers);

		try {
			const response = await this.aiCallService.callAI(
				prompt,
				this.providerConfig.modelId!
			);
			const decision = this.parseDecision(response);
			this.validateDecision(decision, context.members);
			return decision;
		} catch (error) {
			console.error("Supervisor decision error:", error);
			return this.createFallbackDecision();
		}
	}

	private buildSupervisorPrompt(
		context: ConversationContext,
		availableMembers: GroupChatMember[]
	): string {
		const membersList = availableMembers
			.filter((m) => m.role === "agent")
			.map((m) => `- ${m.name} (${m.title})`)
			.join("\n");

		return `You are a supervisor agent managing a group chat discussion named "${context.groupName}". Your role is to decide who should speak next based on the conversation context and each agent's expertise.

<groupDescription>
${context.groupDescription}
</groupDescription>

<groupMembers>
${membersList}
</groupMembers>

<conversationHistory>
${context.history}
</conversationHistory>

Analyze the conversation and decide:

1. Who should speak next? (Return an array of agent IDs/names and/or 'human', e.g., ['agent_id_1'], ['human'], or ['human', 'agent_id'])
2. Should the conversation stop here? (true if waiting for human input or conversation has reached a natural conclusion)

Respond in this exact JSON format, no other text, no markdown wrapper:

{
  "nextSpeaker": ["agent_id_1", "agent_id_2"],
  "shouldStop": false
}

Rules:
- Always return nextSpeaker as an array, e.g., ['human'], ['agent_id'], or ['human', 'agent_id']
- If the last message was a question directed at humans or requires human input, include 'human' in the array
- If an agent's expertise is needed based on the conversation topic, include that agent
- If the conversation seems complete, set shouldStop to true
- Your goal is to make the conversation as natural as possible
- Consider the natural flow of collaboration (PM → Designer → Developer, etc.)`;
	}

	private parseDecision(responseText: string): SupervisorDecision {
		// Remove markdown code block wrappers if present
		let cleaned = responseText.trim();
		if (cleaned.startsWith("```")) {
			// Remove the opening code block (optionally with language)
			cleaned = cleaned.replace(/^```[a-zA-Z0-9]*\s*/, "");
			// Remove the closing code block
			cleaned = cleaned.replace(/```\s*$/, "");
		}
		return JSON.parse(cleaned) as SupervisorDecision;
	}

	private validateDecision(
		decision: SupervisorDecision,
		members: GroupChatMember[]
	): void {
		if (!Array.isArray(decision.nextSpeaker)) {
			throw new Error("nextSpeaker must always be an array");
		}

		for (const speaker of decision.nextSpeaker) {
			if (
				speaker !== "human" &&
				!members.find((m) => m.name === speaker || m.id === speaker)
			) {
				throw new Error(`Invalid nextSpeaker: ${speaker}`);
			}
		}
	}

	private createFallbackDecision(): SupervisorDecision {
		return {
			nextSpeaker: ["human"],
			reasoning: "Error in supervisor decision, defaulting to human input",
			shouldStop: true
		};
	}
}

class AgentResponseService {
	private aiCallService: AICallService;
	constructor(private providerConfig: ProviderConfig) {
		this.aiCallService = new AICallService(providerConfig);
	}

	async generateResponse(
		agent: GroupChatMember,
		context: ConversationContext
	): Promise<string> {
		if (agent.role !== "agent") {
			throw new Error("Cannot generate response for non-agent member");
		}

		const prompt = this.buildAgentPrompt(agent, context);

		console.log("Agent prompt:", prompt);

		try {
			const response = await this.aiCallService.callAI(
				prompt,
				this.providerConfig.modelId!
			);
			return response;
		} catch (error) {
			console.error("Agent response generation error:", error);
			return `*${agent.name} is having trouble responding right now. Please try again later.*`;
		}
	}

	private buildAgentPrompt(
		agent: GroupChatMember,
		context: ConversationContext
	): string {
		const membersList = context.members
			.map((m) => `- ${m.name} (${m.title} [id: ${m.id}])`)
			.join("\n");

		return `<YourBio>
${agent.system_prompt}
</YourBio>

You are participating in a group chat in real world.

<GroupMembers>
${membersList}
</GroupMembers>

Guidelines:
- Stay in character as ${agent.name} (${agent.title})
- Be concise and natural, behave like a real person
- Each message should no more than ${AGENT_CONFIG.RESPONSE_LIMITS.MAX_WORDS} words or ${AGENT_CONFIG.RESPONSE_LIMITS.MAX_CHINESE_CHARS} chinese characters unless it's a code block or a long quote
- Collaborate effectively with other team members
- Follow user's language
- You must always return a JSON object: { "content": "your message", "target": "target_member_id (optional)" }. If you want to send a public message, omit the target field. If you want to send a DM, set the target field to the member's id.

<ConversationHistory>
${context.history}
</ConversationHistory>

Provide your response to continue this discussion. Always return a JSON object as described above. Do not return plain text.`;
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
	private idleTimeout: NodeJS.Timeout | null = null;

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

	async makeSupervisionDecision(
		members: GroupChatMember[],
		conversationHistory: string,
		groupName: string,
		groupDescription: string
	): Promise<SupervisorDecision> {
		const availableAgents = this.memberService.getAvailableAgents(
			members,
			this.typingPool.typingAgents
		);
		const availableMembers = [
			...members.filter((m) => m.role === "human"),
			...availableAgents
		];

		const context = this.conversationService.createConversationContext(
			this.groupId,
			groupName,
			groupDescription,
			members,
			[]
		);
		context.history = conversationHistory;

		return this.supervisorService.makeDecision(context, availableMembers);
	}

	async processHumanMessage(
		userMessage: string,
		userId: string,
		conversationHistory: MessageWithDetails[],
		groupName: string,
		groupDescription: string
	): Promise<void> {
		const members = await this.memberService.getGroupMembers();
		const updatedHistory = this.createUpdatedHistory(
			conversationHistory,
			userMessage,
			userId,
			members
		);

		this.clearIdleTimeout();
		await this.triggerSupervisorCycle(
			members,
			updatedHistory,
			groupName,
			groupDescription
		);
		this.setIdleTimeout(members, groupName, groupDescription);
	}

	async startConversation(
		topic: string,
		conversationHistory: MessageWithDetails[] = []
	): Promise<void> {
		const members = await this.memberService.getGroupMembers();
		let currentHistory =
			this.conversationService.formatHistory(conversationHistory);

		if (conversationHistory.length > 0) {
			currentHistory += "\n";
		}
		currentHistory += `Human: ${topic}`;

		await this.runConversationLoop(members, currentHistory);
	}

	private createUpdatedHistory(
		conversationHistory: MessageWithDetails[],
		userMessage: string,
		userId: string,
		members: GroupChatMember[]
	): MessageWithDetails[] {
		const userMember = members.find((m) => m.id === userId);
		return [
			...conversationHistory,
			{
				content: userMessage,
				senderUser: {
					name: userMember?.name || "User"
				}
			} as MessageWithDetails
		];
	}

	private async triggerSupervisorCycle(
		members: GroupChatMember[],
		initialHistory: MessageWithDetails[],
		groupName: string,
		groupDescription: string
	): Promise<void> {
		if (this.isSupervisorActive) {
			console.log("Supervisor request discarded: already active");
			return;
		}

		this.isSupervisorActive = true;
		const currentHistory =
			this.conversationService.formatHistory(initialHistory);

		try {
			await this.runSupervisorLoop(
				members,
				currentHistory,
				groupName,
				groupDescription
			);
		} finally {
			this.isSupervisorActive = false;
		}
	}

	private async runSupervisorLoop(
		members: GroupChatMember[],
		initialHistory: string,
		groupName: string,
		groupDescription: string
	): Promise<void> {
		let currentHistory = initialHistory;

		while (true) {
			const availableAgents = this.memberService.getAvailableAgents(
				members,
				this.typingPool.typingAgents
			);
			const availableMembers = [
				...members.filter((m) => m.role === "human"),
				...availableAgents
			];

			const context = this.conversationService.createConversationContext(
				this.groupId,
				groupName,
				groupDescription,
				members,
				await this.conversationService.getLatestSessionMessages(
					this.groupId,
					undefined,
					true
				),
				undefined,
				true
			);
			const decision = await this.supervisorService.makeDecision(
				context,
				availableMembers
			);
			console.log("Supervisor decision:", decision);

			if (decision.shouldStop || decision.nextSpeaker.includes("human")) {
				break;
			}

			const nextAgents = this.memberService.findMembersByIdentifiers(
				availableAgents,
				decision.nextSpeaker
			);

			if (nextAgents.length === 0) {
				console.error("No available agents found:", decision.nextSpeaker);
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

			currentHistory = await this.updateHistoryFromDatabase();
			await this.delay(AGENT_CONFIG.SUPERVISOR.POST_RESPONSE_DELAY_MS);
		}
	}

	private async runConversationLoop(
		members: GroupChatMember[],
		initialHistory: string
	): Promise<void> {
		let currentHistory = initialHistory;

		while (true) {
			const availableAgents = this.memberService.getAvailableAgents(
				members,
				this.typingPool.typingAgents
			);
			const availableMembers = [
				...members.filter((m) => m.role === "human"),
				...availableAgents
			];

			const context = this.conversationService.createConversationContext(
				this.groupId,
				"",
				"",
				members,
				[]
			);
			context.history = currentHistory;

			const decision = await this.supervisorService.makeDecision(
				context,
				availableMembers
			);
			console.log("Supervisor decision:", decision);

			if (decision.shouldStop || decision.nextSpeaker.includes("human")) {
				break;
			}

			const nextAgents = this.memberService.findMembersByIdentifiers(
				availableAgents,
				decision.nextSpeaker
			);

			if (nextAgents.length === 0) {
				console.error("No available agents found:", decision.nextSpeaker);
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

			currentHistory = await this.updateHistoryFromDatabase();
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
					await this.executeAgentResponse(agent, context);
				} finally {
					this.typingPool.remove(agent.id);
					resolve();
				}
			}, delay);
		});
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
		const updatedContext = this.conversationService.createConversationContext(
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
			...(dm_target_id ? { dm_target_id } : {})
		});
	}

	private calculateResponseDelay(): number {
		const { MIN_MS, MAX_MS } = AGENT_CONFIG.RESPONSE_DELAY;
		return Math.floor(Math.random() * (MAX_MS - MIN_MS + 1)) + MIN_MS;
	}

	private async updateHistoryFromDatabase(): Promise<string> {
		const latestMessages =
			await this.conversationService.getLatestSessionMessages(this.groupId);
		return this.conversationService.formatHistory(latestMessages);
	}

	private async waitForAgentsToFinish(): Promise<void> {
		await this.delay(AGENT_CONFIG.SUPERVISOR.DECISION_RETRY_DELAY_MS);
	}

	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	private clearIdleTimeout(): void {
		if (this.idleTimeout) {
			clearTimeout(this.idleTimeout);
			this.idleTimeout = null;
		}
	}

	private setIdleTimeout(
		members: GroupChatMember[],
		groupName: string,
		groupDescription: string
	): void {
		this.idleTimeout = setTimeout(() => {
			this.triggerSupervisorCycle(members, [], groupName, groupDescription);
		}, AGENT_CONFIG.SUPERVISOR.IDLE_TIMEOUT_MS);
	}
}
