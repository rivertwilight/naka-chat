'use client';

import { db, dbHelpers } from './database';

// Check if database is already seeded
export async function isDatabaseSeeded(): Promise<boolean> {
  const userCount = await db.users.count();
  return userCount > 0;
}

// Seed the database with initial data
export async function seedDatabase() {
	try {
		// Check if already seeded to prevent duplicate data
		const isSeeded = await isDatabaseSeeded();
		if (isSeeded) {
			console.log("Database already seeded, skipping...");
			return null;
		}

		console.log("Starting database seed...");

		// Create users
		const user1 = await dbHelpers.createUser({
			name: "Alex Chen",
			email: "alex@example.com",
			avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
		});

		console.log("Created user:", user1);

		// Create agents with different specializations
		const pmAgent = await dbHelpers.createAgent({
			name: "Maya",
			title: "Product Manager",
			system_prompt: `You are Maya, an experienced Product Manager. You focus on:
- Understanding user needs and business requirements
- Breaking down complex projects into manageable features
- Prioritizing features and managing scope
- Coordinating between different team members
- Asking clarifying questions about requirements and goals
- Providing strategic direction and product vision

You are collaborative, analytical, and always think about the bigger picture while keeping user value at the center of decisions.`,
			model: "gemini-2.0-flash-exp",
			temperature: 0.7,
			max_output_tokens: 1000,
			avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=maya",
		});

		const designerAgent = await dbHelpers.createAgent({
			name: "Zara",
			title: "UX/UI Designer",
			system_prompt: `You are Zara, a creative UX/UI Designer. You specialize in:
- User experience design and user interface design
- Creating wireframes, prototypes, and design systems
- Understanding user journeys and interaction patterns
- Accessibility and inclusive design principles
- Visual design and design system consistency
- Collaborating with developers on implementation feasibility

You think visually, prioritize user experience, and balance aesthetics with functionality. You often suggest design patterns and user research insights.`,
			model: "gemini-2.0-flash-exp",
			temperature: 0.8,
			max_output_tokens: 1000,
			avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=zara",
		});

		const developerAgent = await dbHelpers.createAgent({
			name: "Sam",
			title: "Full-Stack Developer",
			system_prompt: `You are Sam, a skilled Full-Stack Developer. You focus on:
- Technical implementation and architecture decisions
- Frontend and backend development considerations
- Database design and API development
- Performance optimization and scalability
- Code quality, testing, and development best practices
- Technical feasibility and implementation timelines
- Modern web technologies and frameworks

You are pragmatic, detail-oriented, and always consider technical trade-offs. You provide realistic estimates and suggest technical solutions.`,
			model: "gemini-2.0-flash-exp",
			temperature: 0.6,
			max_output_tokens: 1200,
			avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=sam",
		});

		console.log("Created agents:", { pmAgent, designerAgent, developerAgent });

		// Create a test group
		const group = await dbHelpers.createGroup({
			name: "Product Development Team",
			description: "A collaborative space for product development discussions",
			created_by: user1.id,
		});

		console.log("Created group:", group);

		// Add members to the group
		await dbHelpers.addGroupMember({
			group_id: group.id,
			user_id: user1.id,
			role: "human",
			status: "active",
		});

		await dbHelpers.addGroupMember({
			group_id: group.id,
			agent_id: pmAgent.id,
			role: "agent",
			status: "active",
		});

		await dbHelpers.addGroupMember({
			group_id: group.id,
			agent_id: designerAgent.id,
			role: "agent",
			status: "active",
		});

		await dbHelpers.addGroupMember({
			group_id: group.id,
			agent_id: developerAgent.id,
			role: "agent",
			status: "active",
		});

		console.log("Added group members");

		// Create an initial session
		const session = await dbHelpers.createSession({
			group_id: group.id,
			name: "Welcome Session",
			context: {
				topic: "Getting started with the team",
				summary: "Initial team introduction and setup",
			},
		});

		console.log("Created session:", session);

		// Add a welcome message
		await dbHelpers.sendMessage({
			session_id: session.id,
			sender_user_id: user1.id,
			content: "Welcome to our Product Development Team! Let's collaborate on building amazing products together. 🚀",
		});

		console.log("Database seeded successfully!");
		return {
			user: user1,
			agents: [pmAgent, designerAgent, developerAgent],
			group,
			session,
		};
	} catch (error) {
		console.error("Error seeding database:", error);
		throw error;
	}
}

// Helper to get user-friendly group IDs (1, 2, 3) mapped to actual UUIDs
export async function getGroupIdMapping(): Promise<Record<string, string>> {
  const groups = await db.groups.orderBy('created_at').toArray();
  const mapping: Record<string, string> = {};
  
  groups.forEach((group, index) => {
    mapping[(index + 1).toString()] = group.id;
  });
  
  return mapping;
} 
