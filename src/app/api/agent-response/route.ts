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

interface AgentResponseRequest {
	agent: GroupChatMember;
	context: ConversationContext;
	providerConfig: ProviderConfig;
}

const AGENT_CONFIG = {
	RESPONSE_LIMITS: {
		MAX_WORDS: 150,
		MAX_CHINESE_CHARS: 50,
	},
} as const;

function buildAgentPrompt(
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

export async function POST(request: NextRequest) {
	try {
		const body: AgentResponseRequest = await request.json();
		const { agent, context, providerConfig } = body;

		if (agent.role !== "agent") {
			return NextResponse.json(
				{ error: "Cannot generate response for non-agent member" },
				{ status: 400 }
			);
		}

		const prompt = buildAgentPrompt(agent, context);

		console.log("Agent prompt:", prompt);

		try {
			const response = await callAI(
				prompt,
				providerConfig.modelId!,
				providerConfig
			);

			return NextResponse.json({ response });
		} catch (error) {
			console.error("Agent response generation error:", error);
			const fallbackResponse = `*${agent.name} is having trouble responding right now. Please try again later.*`;
			return NextResponse.json({ response: fallbackResponse });
		}
	} catch (error) {
		console.error("API error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
