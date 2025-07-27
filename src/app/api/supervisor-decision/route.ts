import { NextRequest, NextResponse } from "next/server";
import { callAI, ProviderConfig } from "@/lib/aiUtils";

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

export interface ConversationContext {
	groupId: string;
	groupName: string;
	groupDescription: string;
	members: GroupChatMember[];
	history: string;
}

export interface SupervisorDecision {
	nextSpeaker: string[];
	reasoning: string;
}

interface SupervisorDecisionRequest {
	context: ConversationContext;
	availableMembers: GroupChatMember[];
	providerConfig: ProviderConfig;
}

function buildSupervisorPrompt(
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

Analyze the conversation and decide who should speak next based on the conversation context.

Respond in this exact JSON format, no other text, no markdown wrapper:

{
  "nextSpeaker": ["agent_id_1", "agent_id_2"]
}

Rules:
- Always return nextSpeaker as an array, e.g., ['human'], ['agent_id'], or ['human', 'agent_id']
- If the last message was a question directed at humans or requires human input, include 'human' in the array
- If an agent's expertise is needed based on the conversation topic, include that agent
- If the conversation seems complete, return empty array [] or ['human']. DM needed should not be considered as a conversation complete, and the DM sender need to be included in the nextSpeaker array.
- Your goal is to make the conversation as natural as possible`;
}

function parseDecision(responseText: string): SupervisorDecision {
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

function validateDecision(
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

function createFallbackDecision(): SupervisorDecision {
	return {
		nextSpeaker: ["human"],
		reasoning: "Error in supervisor decision, defaulting to human input",
	};
}

export async function POST(request: NextRequest) {
	try {
		const body: SupervisorDecisionRequest = await request.json();
		const { context, availableMembers, providerConfig } = body;

		const prompt = buildSupervisorPrompt(context, availableMembers);

		try {
			const response = await callAI(
				prompt,
				providerConfig.modelId!,
				providerConfig
			);
			const decision = parseDecision(response);
			validateDecision(decision, context.members);

			return NextResponse.json(decision);
		} catch (error) {
			console.error("Supervisor decision error:", error);
			const fallbackDecision = createFallbackDecision();
			return NextResponse.json(fallbackDecision);
		}
	} catch (error) {
		console.error("API error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
