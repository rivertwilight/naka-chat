import { dbHelpers, Agent, MessageWithDetails, db } from "./database";
import { GoogleGenAI } from "@google/genai";

export interface ProviderConfig {
	provider: "Google";
	apiKey: string;
	baseUrl?: string;
}

const AGENT_RESPONSE_DELAY_MIN_MS = 1000; // 1s
const AGENT_RESPONSE_DELAY_MAX_MS = 120000; // 120s
const AGENT_TYPING_POOL_MAX = 4; // Max concurrent agents typing/responding

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
	nextSpeaker: string[]; // Always an array, e.g., ['human'], ['agent_id'], or ['human', 'agent_id']
	reasoning: string;
	shouldStop: boolean;
}

export class AgentGroupChat {
	private groupId: string;
	private providerConfig: ProviderConfig;

	constructor(groupId: string, providerConfig: ProviderConfig) {
		this.groupId = groupId;
		this.providerConfig = providerConfig;
	}

	/**
	 * Get all active members of the group (both users and agents)
	 */
	private async getGroupMembers(): Promise<GroupChatMember[]> {
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
			} else if (member.role === "agent" && member.details) {
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

	/**
	 * Format conversation history for context
	 */
	private formatConversationHistory(messages: MessageWithDetails[]): string {
		return messages
			.map((msg) => {
				const sender = msg.senderUser
					? msg.senderUser.name
					: msg.senderAgent
					? msg.senderAgent.name
					: "Unknown";
				return `${sender}: ${msg.content}`;
			})
			.join("\n");
	}

	/**
	 * Supervisor agent decides who should speak next
	 */
	private async decideBySupervisor(
		members: GroupChatMember[],
		conversationHistory: string,
		groupName: string,
		groupDescription: string
	): Promise<SupervisorDecision> {
		const membersList = members
			.filter((m) => m.role === "agent")
			.map((m) => `- ${m.name} (${m.title})`)
			.join("\n");

		const prompt = `You are a supervisor agent managing a group chat discussion named "${groupName}". Your role is to decide who should speak next based on the conversation context and each agent's expertise.

<groupDescription>
${groupDescription}
</groupDescription>

<groupMembers>
${membersList}
</groupMembers>

<conversationHistory>
${conversationHistory}
</conversationHistory>

Analyze the conversation and decide:

1. Who should speak next? (Return an array of agent IDs/names and/or 'human', e.g., ['agent_id_1'], ['human'], or ['human', 'agent_id'])
2. Should the conversation stop here? (true if waiting for human input or conversation has reached a natural conclusion)

Respond in this exact JSON format, no other text, no markdown wrapper, such as:

<example>
{
  "nextSpeaker": ["agent_id_1", "agent_id_2"],
  "shouldStop": false
}
</example>

Rules:
- Always return nextSpeaker as an array, e.g., ['human'], ['agent_id'], or ['human', 'agent_id']
- If the last message was a question directed at humans or requires human input, include 'human' in the array
- If an agent's expertise is needed based on the conversation topic, include that agent
- If the conversation seems complete, set shouldStop to true
- Your goal is to make the conversation as natural as possible
- Consider the natural flow of collaboration (PM → Designer → Developer, etc.)`;

		try {
			const ai = new GoogleGenAI({ apiKey: this.providerConfig.apiKey });
			console.log("Supervisor prompt:", prompt);

			const response = await ai.models.generateContent({
				model: "gemini-2.5-flash",
				contents: [{ role: "user", parts: [{ text: prompt }] }],
			});

			console.log("Supervisor result:", response.text);

			const responseText = response.text;
			if (!responseText) {
				throw new Error("Empty response from AI model");
			}

			const decision = JSON.parse(responseText) as SupervisorDecision;

			// Validate the decision
			console.log("decision", decision);
			console.log("members", members);

			if (!Array.isArray(decision.nextSpeaker)) {
				throw new Error("nextSpeaker must always be an array");
			}
			for (const speaker of decision.nextSpeaker) {
				if (
					speaker !== "human" &&
					!members.find((m) => m.name === speaker || m.id === speaker)
				) {
					throw new Error(
						"Invalid nextSpeaker in supervisor decision: " + speaker
					);
				}
			}

			return decision;
		} catch (error) {
			console.error("Supervisor decision error:", error);
			// Fallback decision
			return {
				nextSpeaker: ["human"],
				reasoning:
					"Error in supervisor decision, defaulting to human input",
				shouldStop: true,
			};
		}
	}

	/**
	 * Generate agent response based on their role and the conversation
	 */
	private async generateAgentResponse(
		agent: GroupChatMember,
		conversationHistory: string,
		members: GroupChatMember[]
	): Promise<string> {
		if (agent.role !== "agent") {
			throw new Error("Cannot generate response for non-agent member");
		}

		const membersList = members
			.map((m) => `- ${m.name} (${m.title})`)
			.join("\n");

		const prompt = `<YourBio>
${agent.system_prompt}
</YourBio>

You are participating in a group chat in real world.

<GroupMembers>
${membersList}
</GroupMembers>

Guidelines:
- Stay in character as ${agent.name} (${agent.title})
- Be concise and natural, behave like a real person
- Each message should no more than 150 words or 50 chinese characters unless it's a code block or a long quote
- Collaborate effectively with other team members
- Follow user's language

<ConversationHistory>
${conversationHistory}
</ConversationHistory>

Provide your response to continue this discussion. Focus on your area of expertise and add value to the conversation. Directly returen the message content.`;

		try {
			const ai = new GoogleGenAI({ apiKey: this.providerConfig.apiKey });
			const response = await ai.models.generateContent({
				model: "gemini-2.5-pro",
				contents: [{ role: "user", parts: [{ text: prompt }] }],
			});

			return response.text || "";
		} catch (error) {
			console.error("Agent response generation error:", error);
			return `*${agent.name} is having trouble responding right now. Please try again later.*`;
		}
	}

	// Helper to fetch latest messages with sender details for the current session
	private async getLatestSessionMessagesWithDetails(): Promise<
		MessageWithDetails[]
	> {
		const currentSession = await dbHelpers.getCurrentSession(this.groupId);
		const sessionMessages = await dbHelpers.getMessagesWithReactions(
			currentSession.id
		);
		// Enhance messages with sender details
		const enhancedMessages = await Promise.all(
			sessionMessages.map(async (message) => {
				let senderUser;
				let senderAgent;
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
					session: currentSession,
				};
			})
		);
		// Sort by creation time
		enhancedMessages.sort(
			(a, b) => a.created_at.getTime() - b.created_at.getTime()
		);
		return enhancedMessages;
	}

	/**
	 * Process a new human message and potentially trigger agent responses
	 */
	async processHumanMessage(
		userMessage: string,
		userId: string,
		conversationHistory: MessageWithDetails[],
		groupName: string,
		groupDescription: string
	): Promise<void> {
		const members = await this.getGroupMembers();

		const updatedHistory = [
			...conversationHistory,
			{
				content: userMessage,
				senderUser: {
					name: members.find((m) => m.id === userId)?.name || "User",
				},
			} as MessageWithDetails,
		];

		let currentHistory = this.formatConversationHistory(updatedHistory);

		// Agent typing pool: Set of agent IDs currently responding
		const agentTypingPool = new Set<string>();

		// Supervisor trigger state
		let lastMessageTimestamp = Date.now();
		let idleTimeout: NodeJS.Timeout | null = null;
		let supervisorActive = false;

		const triggerSupervisor = async () => {
			if (supervisorActive) {
				console.log("Supervisor request discarded: already active");
				return;
			}
			supervisorActive = true;
			try {
				while (true) {
					// Exclude agents in the pool from supervisor decision
					const availableMembers = members.filter(
						(m) => m.role !== "agent" || !agentTypingPool.has(m.id)
					);
					const decision = await this.decideBySupervisor(
						availableMembers,
						currentHistory,
						groupName,
						groupDescription
					);
					console.log("Supervisor decision:", decision);
					if (
						decision.shouldStop ||
						decision.nextSpeaker.includes("human")
					) {
						break;
					}
					const nextAgents = decision.nextSpeaker
						.map((speaker) =>
							members.find(
								(m) =>
									(m.name === speaker || m.id === speaker) &&
									m.role === "agent" &&
									!agentTypingPool.has(m.id)
							)
						)
						.filter(Boolean) as GroupChatMember[];
					if (nextAgents.length === 0) {
						console.error(
							"Agent(s) not found or already typing:",
							decision.nextSpeaker
						);
						break;
					}
					// Limit pool size
					const agentsToStart = nextAgents.slice(
						0,
						AGENT_TYPING_POOL_MAX - agentTypingPool.size
					);
					if (agentsToStart.length === 0) {
						// Pool is full, wait for some agents to finish
						await new Promise((resolve) =>
							setTimeout(resolve, 1000)
						);
						continue;
					}
					const agentPromises = agentsToStart.map((agent) => {
						agentTypingPool.add(agent.id);
						const delay =
							Math.floor(
								Math.random() *
									(AGENT_RESPONSE_DELAY_MAX_MS -
										AGENT_RESPONSE_DELAY_MIN_MS +
										1)
							) + AGENT_RESPONSE_DELAY_MIN_MS;
						return new Promise<void>((resolve) => {
							setTimeout(async () => {
								const latestMessages =
									await this.getLatestSessionMessagesWithDetails();
								const formattedHistory =
									this.formatConversationHistory(
										latestMessages
									);
								const response =
									await this.generateAgentResponse(
										agent,
										formattedHistory,
										members
									);
								const currentSession =
									await dbHelpers.getCurrentSession(
										this.groupId
									);
								await dbHelpers.sendMessage({
									session_id: currentSession.id,
									sender_agent_id: agent.id,
									content: response,
								});
								agentTypingPool.delete(agent.id);
								// Only update currentHistory, do not trigger supervisor again
								const latestMessagesAfter =
									await this.getLatestSessionMessagesWithDetails();
								currentHistory =
									this.formatConversationHistory(
										latestMessagesAfter
									);
								lastMessageTimestamp = Date.now();
								// Reset idle timer after agent message
								if (idleTimeout) clearTimeout(idleTimeout);
								idleTimeout = setTimeout(() => {
									triggerSupervisor();
								}, 5000);
								resolve();
							}, delay);
						});
					});
					await Promise.all(agentPromises);
					const latestMessages =
						await this.getLatestSessionMessagesWithDetails();
					currentHistory =
						this.formatConversationHistory(latestMessages);
					await new Promise((resolve) => setTimeout(resolve, 1000));
				}
			} finally {
				supervisorActive = false;
			}
		};

		// Human message: trigger supervisor immediately
		if (idleTimeout) clearTimeout(idleTimeout);
		await triggerSupervisor();

		// Set idle timer for future inactivity
		idleTimeout = setTimeout(() => {
			triggerSupervisor();
		}, 5000);
	}

	/**
	 * Start a conversation with a specific topic or question
	 */
	async startConversation(
		topic: string,
		conversationHistory: MessageWithDetails[] = []
	): Promise<void> {
		const members = await this.getGroupMembers();
		let currentHistory =
			this.formatConversationHistory(conversationHistory) +
			(conversationHistory.length > 0 ? "\n" : "") +
			`Human: ${topic}`;
		let lastSpeaker = "Human";

		// Agent typing pool: Set of agent IDs currently responding
		const agentTypingPool = new Set<string>();

		while (true) {
			// Exclude agents in the pool from supervisor decision
			const availableMembers = members.filter(
				(m) => m.role !== "agent" || !agentTypingPool.has(m.id)
			);
			const decision = await this.decideBySupervisor(
				availableMembers,
				currentHistory,
				lastSpeaker,
				""
			);
			console.log("Supervisor decision:", decision);
			if (decision.shouldStop || decision.nextSpeaker.includes("human")) {
				break;
			}
			const nextAgents = decision.nextSpeaker
				.map((speaker) =>
					members.find(
						(m) =>
							(m.name === speaker || m.id === speaker) &&
							m.role === "agent" &&
							!agentTypingPool.has(m.id)
					)
				)
				.filter(Boolean) as GroupChatMember[];
			if (nextAgents.length === 0) {
				console.error(
					"Agent(s) not found or already typing:",
					decision.nextSpeaker
				);
				break;
			}
			// Limit pool size
			const agentsToStart = nextAgents.slice(
				0,
				AGENT_TYPING_POOL_MAX - agentTypingPool.size
			);
			if (agentsToStart.length === 0) {
				// Pool is full, wait for some agents to finish
				await new Promise((resolve) => setTimeout(resolve, 1000));
				continue;
			}
			const agentPromises = agentsToStart.map((agent) => {
				agentTypingPool.add(agent.id);
				const delay =
					Math.floor(
						Math.random() *
							(AGENT_RESPONSE_DELAY_MAX_MS -
								AGENT_RESPONSE_DELAY_MIN_MS +
								1)
					) + AGENT_RESPONSE_DELAY_MIN_MS;
				return new Promise<void>((resolve) => {
					setTimeout(async () => {
						// Fetch latest messages before responding
						const latestMessages =
							await this.getLatestSessionMessagesWithDetails();
						const formattedHistory =
							this.formatConversationHistory(latestMessages);
						const response = await this.generateAgentResponse(
							agent,
							formattedHistory,
							members
						);
						const currentSession =
							await dbHelpers.getCurrentSession(this.groupId);
						await dbHelpers.sendMessage({
							session_id: currentSession.id,
							sender_agent_id: agent.id,
							content: response,
						});
						agentTypingPool.delete(agent.id);
						// After agent finishes, immediately ask supervisor for next decision
						const latestMessagesAfter =
							await this.getLatestSessionMessagesWithDetails();
						currentHistory =
							this.formatConversationHistory(latestMessagesAfter);
						if (agentsToStart.length > 0) {
							lastSpeaker =
								agentsToStart[agentsToStart.length - 1].name;
						}
						resolve();
					}, delay);
				});
			});
			// Wait for all scheduled agent responses to complete
			await Promise.all(agentPromises);
			// After all agents have responded, fetch latest messages for next supervisor decision
			const latestMessages =
				await this.getLatestSessionMessagesWithDetails();
			currentHistory = this.formatConversationHistory(latestMessages);
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}
	}
}
