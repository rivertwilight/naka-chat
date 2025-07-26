"use client";

import { db, dbHelpers } from "./database";
import seedMembers from "./seedMembers.json";

export async function isDatabaseSeeded(): Promise<boolean> {
  const agentCount = await db.agents.count();
  return agentCount > 0;
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

    // Create users from JSON
    const createdUsers = [];
    for (const user of seedMembers.users) {
      const createdUser = await dbHelpers.createUser(user);
      createdUsers.push(createdUser);
    }
    const user1 = createdUsers[0];
    console.log("Created users:", createdUsers);

    // Create agents from JSON
    const createdAgents = [];
    for (const agent of seedMembers.agents) {
      // Check if agent with same name and model exists
      const existingAgent = await db.agents
        .where({ name: agent.name, model: agent.model })
        .first();
      if (existingAgent) {
        createdAgents.push(existingAgent);
      } else {
        const createdAgent = await dbHelpers.createAgent(agent);
        createdAgents.push(createdAgent);
      }
    }
    console.log("Created agents:", createdAgents);

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
    for (const agent of createdAgents) {
      await dbHelpers.addGroupMember({
        group_id: group.id,
        agent_id: agent.id,
        role: "agent",
        status: "active",
      });
    }
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
      content:
        "Welcome to our Product Development Team! Let's collaborate on building amazing products together. 🚀",
    });
    console.log("Database seeded successfully!");
    return {
      users: createdUsers,
      agents: createdAgents,
      group,
      session,
    };
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}
