# AgentGroupChat Setup Guide

## Overview

The AgentGroupChat system implements a multi-agent conversation pattern where:
- A **Supervisor Agent** decides who should speak next
- Multiple **specialized agents** (PM, Designer, Developer) collaborate
- **Humans** can participate and guide the conversation

## Quick Setup

### 1. Environment Configuration

Create a `.env.local` file with your Google AI API key:

```bash
# Copy the example file
cp .env.example .env.local

# Edit with your actual API key
GOOGLE_AI_API_KEY=your_actual_google_ai_api_key_here
GOOGLE_AI_MODEL=gemini-2.0-flash-exp
```

**Get your API key:**
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create a new API key
3. Copy it to your `.env.local` file

### 2. Initialize Database with Sample Data

```bash
# Start the development server
pnpm dev

# In another terminal, seed the database
curl -X POST http://localhost:3000/api/seed
```

This creates:
- **Alex Chen** (Human user)
- **Maya** (Product Manager agent)
- **Zara** (UX/UI Designer agent) 
- **Sam** (Full-Stack Developer agent)
- **Product Development Team** group with all members

### 3. Test the Multi-Agent Chat

1. Go to `http://localhost:3000`
2. Navigate to the "Product Development Team" group
3. Send a message like: *"How should we build a todo app?"*
4. Watch the agents collaborate automatically!

## How It Works

### Conversation Flow

```
Human sends message → Supervisor decides who responds → Agent responds → 
Supervisor decides next speaker → Another agent responds → ... → 
Supervisor decides to wait for human input
```

### Agent Roles

- **Maya (PM)**: Requirements, user needs, project scope
- **Zara (Designer)**: User experience, UI design, accessibility  
- **Sam (Developer)**: Technical implementation, architecture, feasibility

### Supervisor Decision Logic

The supervisor agent considers:
- Each agent's expertise relative to the topic
- Natural collaboration flow (PM → Designer → Developer)
- Conversation context and last speaker
- When to pause for human input

## Customization

### Adding New Agents

```typescript
const newAgent = await dbHelpers.createAgent({
  name: "Riley",
  title: "Data Analyst", 
  system_prompt: `You are Riley, a Data Analyst focused on...`,
  model: "gemini-2.0-flash-exp",
  temperature: 0.7,
  max_output_tokens: 1000,
});

// Add to group
await dbHelpers.addGroupMember({
  group_id: groupId,
  agent_id: newAgent.id,
  role: "agent",
  status: "active",
});
```

### Modifying Agent Behavior

Edit the `system_prompt` in the agent creation to change:
- Personality and communication style
- Areas of expertise and focus
- Collaboration preferences
- Response length and format

### Supervisor Customization

Modify `src/lib/agentGroupChat.ts` in the `decideBySupervisor` method to:
- Change decision criteria
- Adjust conversation flow patterns
- Add new decision rules

## Troubleshooting

### API Key Issues
- Ensure `GOOGLE_AI_API_KEY` is set correctly
- Check [Google AI Studio](https://aistudio.google.com/) for API quota

### No Agent Responses
- Check browser console for errors
- Verify agents exist in the group
- Check network tab for API call failures

### Agents Not Collaborating
- Try rephrasing your message to be more specific
- The supervisor might decide only one response is needed
- Some topics may not trigger multi-agent discussions

## Example Conversations

**Good prompts that trigger collaboration:**
- "How should we build a mobile app for task management?"
- "What's the best approach for user onboarding?"
- "Help me plan a new feature for our product"

**Prompts that might get single responses:**
- Simple questions: "What time is it?"
- Personal: "How are you doing?"
- Very specific technical questions

## Architecture

```
ChatClient (UI) → AgentGroupChat (Logic) → Google AI (Gemini) → Database
```

- **ChatClient**: Handles UI, user input, displays messages
- **AgentGroupChat**: Orchestrates multi-agent conversations
- **Supervisor Agent**: Makes decisions about conversation flow
- **Specialized Agents**: Generate responses based on their expertise
- **Database**: Stores conversations, agents, and group data

Enjoy collaborating with your AI team! 🚀 
