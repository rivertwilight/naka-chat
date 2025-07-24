'use client';

import { db, dbHelpers } from './database';

// Check if database is already seeded
export async function isDatabaseSeeded(): Promise<boolean> {
  const userCount = await db.users.count();
  return userCount > 0;
}

// Seed the database with initial data
export async function seedDatabase(): Promise<void> {
  try {
    // Check if already seeded
    if (await isDatabaseSeeded()) {
      console.log('Database already seeded');
      return;
    }

    console.log('Seeding database...');

    // Create users
    const yukiUser = await dbHelpers.createUser({
      name: 'Yuki',
      email: 'yuki@example.com',
      avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face',
    });

    const alexUser = await dbHelpers.createUser({
      name: 'Alex',
      email: 'alex@example.com',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face',
    });

    const minaUser = await dbHelpers.createUser({
      name: 'Mina',
      email: 'mina@example.com',
      avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face',
    });

    const currentUser = await dbHelpers.createUser({
      name: 'You',
      email: 'you@example.com',
    });

    // Create agents
    const kimiAgent = await dbHelpers.createAgent({
      name: 'Kimi',
      title: 'AI Assistant',
      system_prompt: 'You are Kimi, a helpful AI assistant.',
      model: 'kimi-k2',
      temperature: 0.7,
      max_output_tokens: 2048,
      avatar_url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=32&h=32&fit=crop&crop=face',
    });

    // Create groups
    const group1 = await dbHelpers.createGroup({
      name: 'Team Chat',
      description: 'Main team collaboration space',
      created_by: currentUser.id,
    });

    const group2 = await dbHelpers.createGroup({
      name: 'Design Review',
      description: 'UI/UX design discussions',
      created_by: minaUser.id,
    });

    const group3 = await dbHelpers.createGroup({
      name: 'Research Lab',
      description: 'AI research and development',
      created_by: yukiUser.id,
    });

    // Add members to groups
    await dbHelpers.addGroupMember({
      group_id: group1.id,
      user_id: yukiUser.id,
      role: 'human',
      status: 'active',
    });

    await dbHelpers.addGroupMember({
      group_id: group1.id,
      user_id: alexUser.id,
      role: 'human',
      status: 'active',
    });

    await dbHelpers.addGroupMember({
      group_id: group1.id,
      user_id: minaUser.id,
      role: 'human',
      status: 'active',
    });

    await dbHelpers.addGroupMember({
      group_id: group1.id,
      user_id: currentUser.id,
      role: 'human',
      status: 'active',
    });

    await dbHelpers.addGroupMember({
      group_id: group1.id,
      agent_id: kimiAgent.id,
      role: 'agent',
      status: 'active',
    });

    // Create multiple sessions for the first group
    const session1 = await dbHelpers.createSession({
      group_id: group1.id,
      name: 'Daily Standup',
    });

    // Add a small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const session2 = await dbHelpers.createSession({
      group_id: group1.id,
      name: 'Project Discussion',
    });

    // Create messages for session 1 (Daily Standup)
    const message1 = await dbHelpers.sendMessage({
      session_id: session1.id,
      sender_user_id: yukiUser.id,
      content: `おはようございます！How is everyone today?\n\nHere's today's agenda:\n\n- Review last week's progress\n- Discuss new research papers\n- Plan next steps`,
    });

    const message2 = await dbHelpers.sendMessage({
      session_id: session1.id,
      sender_user_id: alexUser.id,
      content: `Good morning! Here's a code snippet for the new UI proposal:\n\n\`\`\`tsx\nfunction KansoButton() {\n  return <button className="kanso">Kanso</button>;\n}\`\`\`\n\nLet me know your thoughts.`,
    });

    const message3 = await dbHelpers.sendMessage({
      session_id: session1.id,
      sender_user_id: minaUser.id,
      content: `@Alex The code looks great!\n\n**Design assets** are available [here](https://figma.com).\n\n- [x] Logo\n- [ ] Color palette\n- [ ] Icons`,
    });

    // Create messages for session 2 (Project Discussion) 
    await new Promise(resolve => setTimeout(resolve, 10));

    const message4 = await dbHelpers.sendMessage({
      session_id: session2.id,
      sender_user_id: yukiUser.id,
      content: `Thank you, everyone! Let's discuss the project roadmap.\n\nLet's aim to finish the color palette by tomorrow. 😊`,
    });

    const message5 = await dbHelpers.sendMessage({
      session_id: session2.id,
      sender_user_id: alexUser.id,
      content: `Sounds good! I'll focus on the technical implementation.\n\n "Simplicity is the ultimate sophistication." — Leonardo da Vinci`,
    });

    const message6 = await dbHelpers.sendMessage({
      session_id: session2.id,
      sender_user_id: currentUser.id,
      content: `Thanks everyone! I'll work on the color palette today. 🙏\n\nLet me know if you need any help with the implementation.`,
    });

    // Add reactions to match the mock data
    await dbHelpers.addReaction({
      message_id: message1.id,
      emoji: '👍',
      user_id: alexUser.id,
    });

    await dbHelpers.addReaction({
      message_id: message1.id,
      emoji: '👍',
      user_id: minaUser.id,
    });

    await dbHelpers.addReaction({
      message_id: message1.id,
      emoji: '😊',
      user_id: currentUser.id,
    });

    await dbHelpers.addReaction({
      message_id: message3.id,
      emoji: '❤️',
      user_id: alexUser.id,
    });

    await dbHelpers.addReaction({
      message_id: message5.id,
      emoji: '😊',
      user_id: minaUser.id,
    });

    await dbHelpers.addReaction({
      message_id: message6.id,
      emoji: '🙏',
      user_id: yukiUser.id,
    });

    await dbHelpers.addReaction({
      message_id: message6.id,
      emoji: '🙏',
      user_id: alexUser.id,
    });

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
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
