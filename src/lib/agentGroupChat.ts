import { dbHelpers, Agent, MessageWithDetails } from "./database";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
	apiKey: process.env.NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY,
});

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

	constructor(groupId: string) {
		this.groupId = groupId;
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
		lastSpeaker?: string
	): Promise<SupervisorDecision> {
		const membersList = members
			.filter((m) => m.role === "agent")
			.map((m) => `- ${m.name} (${m.title})`)
			.join("\n");

		const prompt = `You are a supervisor agent managing a group chat discussion. Your role is to decide who should speak next based on the conversation context and each agent's expertise.

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

		const prompt = `${agent.system_prompt}

You are participating in a group chat with the following members:
${membersList}

Guidelines:
- Stay in character as ${agent.name} (${agent.title})
- Be concise and natural, behave like a real person. You can use emojis to make the message more natural.
- Each message should no more than 150 words or 50 chinese characters unless it's a code block or a long quote
- Collaborate effectively with other team members
- Follow user's language

Conversation so far:

${conversationHistory}

As ${agent.name} (${agent.title}), provide your response to continue this discussion. Focus on your area of expertise and add value to the conversation. Directly returen the message content.`;

		try {
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

	/**
	 * Process a new human message and potentially trigger agent responses
	 */
	async processHumanMessage(
		userMessage: string,
		userId: string,
		conversationHistory: MessageWithDetails[]
	): Promise<void> {
		const members = await this.getGroupMembers();

		// Add human message to history for context
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
		let lastSpeaker = members.find((m) => m.id === userId)?.name || "User";

		// Continue the conversation with agents
		while (true) {
			const decision = await this.decideBySupervisor(
				members,
				currentHistory,
				lastSpeaker
			);

			console.log("Supervisor decision:", decision);

			if (decision.shouldStop || decision.nextSpeaker.includes("human")) {
				break;
			}

			// nextSpeaker is always an array
			const nextAgents = decision.nextSpeaker
				.map((speaker) =>
					members.find(
						(m) =>
							(m.name === speaker || m.id === speaker) &&
							m.role === "agent"
					)
				)
				.filter(Boolean) as GroupChatMember[];

			if (nextAgents.length === 0) {
				console.error("Agent(s) not found:", decision.nextSpeaker);
				break;
			}

			// Generate and send all agent responses in parallel
			const responses = await Promise.all(
				nextAgents.map((agent) =>
					this.generateAgentResponse(agent, currentHistory, members)
				)
			);

			const currentSession = await dbHelpers.getCurrentSession(
				this.groupId
			);
			await Promise.all(
				nextAgents.map((agent, idx) =>
					dbHelpers.sendMessage({
						session_id: currentSession.id,
						sender_agent_id: agent.id,
						content: responses[idx],
					})
				)
			);

			// Update conversation history for all agent responses
			responses.forEach((response, idx) => {
				currentHistory += `\n${nextAgents[idx].name}: ${response}`;
				lastSpeaker = nextAgents[idx].name;
			});

			// Small delay to prevent overwhelming the system
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}
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

		// Begin agent conversation
		while (true) {
			const decision = await this.decideBySupervisor(
				members,
				currentHistory,
				lastSpeaker
			);

			console.log("Supervisor decision:", decision);

			if (decision.shouldStop || decision.nextSpeaker.includes("human")) {
				break;
			}

			// nextSpeaker is always an array
			const nextAgents = decision.nextSpeaker
				.map((speaker) =>
					members.find(
						(m) =>
							(m.name === speaker || m.id === speaker) &&
							m.role === "agent"
					)
				)
				.filter(Boolean) as GroupChatMember[];

			if (nextAgents.length === 0) {
				console.error("Agent(s) not found:", decision.nextSpeaker);
				break;
			}

			// Generate and send all agent responses in parallel
			const responses = await Promise.all(
				nextAgents.map((agent) =>
					this.generateAgentResponse(agent, currentHistory, members)
				)
			);

			const currentSession = await dbHelpers.getCurrentSession(
				this.groupId
			);
			await Promise.all(
				nextAgents.map((agent, idx) =>
					dbHelpers.sendMessage({
						session_id: currentSession.id,
						sender_agent_id: agent.id,
						content: responses[idx],
					})
				)
			);

			// Update conversation history for all agent responses
			responses.forEach((response, idx) => {
				currentHistory += `\n${nextAgents[idx].name}: ${response}`;
				lastSpeaker = nextAgents[idx].name;
			});

			// Small delay to prevent overwhelming the system
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}
	}
}
