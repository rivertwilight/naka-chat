import React from "react";
import { Sawarabi_Mincho } from "next/font/google";
import Dialog from "./Dialog";
import { usePersistance } from "./PersistanceContext";
import { ProviderType } from "./PersistanceContext";
import Image from "next/image";
import { Avatar } from "@lobehub/ui";
import { Plus, Edit, Trash2, Loader, Save, X } from "lucide-react";
import { useAgents } from "@/hooks/useDatabase";
import { dbHelpers } from "@/lib/database";
import { getRandomName, getRandomAvatar } from "@/utils/randomUtils";
import Link from "next/link";
import { ProviderConfig } from "@/lib/aiUtils";

const sawarabi = Sawarabi_Mincho({
	weight: "400",
	subsets: ["latin"],
});

const MODEL_OPTIONS = {
	Google: [
		{ value: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
		{ value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
		{
			value: "gemini-2.5-flash",
			label: "Gemini 2.5 Flash",
		},
		{
			value: "gemini-2.5-pro",
			label: "Gemini 2.5 Pro",
		},
	],
	Anthropic: [
		{ value: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet" },
		{ value: "claude-3-opus-20240229", label: "Claude 3 Opus" },
		{ value: "claude-3-sonnet-20240229", label: "Claude 3 Sonnet" },
		{ value: "claude-3-haiku-20240307", label: "Claude 3 Haiku" },
	],
	OpenAI: [
		{ value: "gpt-4o", label: "GPT-4o" },
		{ value: "gpt-4o-mini", label: "GPT-4o Mini" },
		{ value: "gpt-4-turbo", label: "GPT-4 Turbo" },
		{ value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
	],
	Moonshot: [
		{ value: "kimi-latest", label: "Kimi Latest" },
		{ value: "kimi-k2", label: "Kimi K2" },
	],
	Custom: [],
	NakaChat: [{ value: "Qwen/Qwen3-8B", label: "Qwen3" }],
};

const OPEN_SOURCE_PROJECTS = [
	{ repo: "vercel/next.js", icon: "github" },
	{ repo: "lobehub/lobe-ui", icon: "lobe" },
	{ repo: "lucide-icons/lucide", icon: "github" },
	{ repo: "tailwindlabs/tailwindcss", icon: "github" },
	{ repo: "google/fonts", icon: "github" },
];

const sidebarNav = [
	{ key: "general", label: "General" },
	{ key: "model", label: "Model" },
	{ key: "chat", label: "Chat" },
	{ key: "agents", label: "Agents" },
	{ key: "about", label: "About" },
];

function GeneralSection() {
	const { firstName, lastName, setFirstName, setLastName } = usePersistance();
	return (
		<>
			<div className="flex gap-4">
				<div className="flex-1">
					<label
						htmlFor="first-name"
						className="block text-sm text-neutral-600 dark:text-neutral-300 mb-2"
					>
						First Name
					</label>
					<input
						id="first-name"
						className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-4 py-3 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400 transition"
						placeholder="Your first name"
						value={firstName}
						onChange={(e) => setFirstName(e.target.value)}
					/>
				</div>
				<div className="flex-1">
					<label
						htmlFor="last-name"
						className="block text-sm text-neutral-600 dark:text-neutral-300 mb-2"
					>
						Last Name
					</label>
					<input
						id="last-name"
						className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-4 py-3 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400 transition"
						placeholder="Your last name"
						value={lastName}
						onChange={(e) => setLastName(e.target.value)}
					/>
				</div>
			</div>
		</>
	);
}

function ModelSection() {
	const {
		provider,
		setProvider,
		getApiKey,
		setApiKey,
		baseUrl,
		setBaseUrl,
		modelId,
		setModelId,
	} = usePersistance();

	// Get the current API key for the selected provider
	const currentApiKey = getApiKey(provider);

	// Auto-select first model when provider changes and current model is not available
	React.useEffect(() => {
		if (provider !== "Custom" && MODEL_OPTIONS[provider].length > 0) {
			const currentModelExists = MODEL_OPTIONS[provider].some(
				(option) => option.value === modelId
			);
			if (!currentModelExists) {
				setModelId(MODEL_OPTIONS[provider][0].value);
			}
		}
	}, [provider, modelId, setModelId]);

	return (
		<>
			<div className="mb-4">
				<label
					htmlFor="provider"
					className="block text-sm text-neutral-600 dark:text-neutral-300 mb-2"
				>
					Provider
				</label>
				<div className="relative">
					<select
						id="provider"
						value={provider}
						onChange={(e) => setProvider(e.target.value as ProviderType)}
						className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent appearance-none px-4 py-3 pr-10 text-neutral-900 dark:text-neutral-100 focus:outline-none select-none focus:ring-2 focus:ring-neutral-400 dark:focus:border-neutral-600 transition"
					>
						{Object.keys(MODEL_OPTIONS).map((provider) => (
							<option key={provider} value={provider}>
								{provider}
							</option>
						))}
					</select>
					<div className="pointer-events-none absolute inset-y-0 right-2 flex items-center px-2 text-neutral-500">
						<svg
							className="fill-current h-4 w-4"
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 20 20"
						>
							<path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
						</svg>
					</div>
				</div>
			</div>
			{provider !== "NakaChat" && (
				<div>
					<label
						htmlFor="api"
						className="block text-sm text-neutral-600 dark:text-neutral-300 mb-2"
					>
						API Key
					</label>
					<input
						id="api"
						className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-4 py-3 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400 transition"
						placeholder={"Your API Key"}
						value={getApiKey(provider)}
						type="password"
						onChange={(e) => setApiKey(provider, e.target.value)}
					/>
				</div>
			)}
			{provider === "Custom" && (
				<div className="mt-4">
					<label
						htmlFor="base-url"
						className="block text-sm text-neutral-600 dark:text-neutral-300 mb-2"
					>
						Base URL
					</label>
					<input
						id="base-url"
						className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-4 py-3 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400 transition"
						placeholder="Your Base URL"
						value={baseUrl}
						onChange={(e) => setBaseUrl(e.target.value)}
					/>
				</div>
			)}
			<div>
				<label
					htmlFor="model-id"
					className="block text-sm text-neutral-600 dark:text-neutral-300 mb-2"
				>
					Model
				</label>
				{provider === "Custom" ? (
					<input
						id="model-id"
						className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-4 py-3 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400 transition"
						placeholder="Your Model ID"
						value={modelId}
						onChange={(e) => setModelId(e.target.value)}
					/>
				) : (
					<div className="relative">
						<select
							id="model-id"
							value={modelId}
							onChange={(e) => setModelId(e.target.value)}
							className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent appearance-none px-4 py-3 pr-10 text-neutral-900 dark:text-neutral-100 focus:outline-none select-none focus:ring-2 focus:ring-neutral-400 dark:focus:border-neutral-600 transition"
						>
							{MODEL_OPTIONS[provider].map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
						<div className="pointer-events-none absolute inset-y-0 right-2 flex items-center px-2 text-neutral-500">
							<svg
								className="fill-current h-4 w-4"
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 20 20"
							>
								<path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
							</svg>
						</div>
					</div>
				)}
				<div className="text-sm text-neutral-500 dark:text-neutral-400 mt-4">
					You are setting the default AI model for all agents. You can config AI
					model per-agent in their settings.
					<Link
						href="https://github.com/moonshot-ai/moonshot-docs/blob/main/docs/models.md"
						target="_blank"
						className="text-orange-500 dark:text-orange-400 ml-2"
					>
						Learn more
					</Link>
				</div>
			</div>
		</>
	);
}

function AgentsSection() {
	const { agents, loading, error } = useAgents();
	const [editingAgent, setEditingAgent] = React.useState<number | null>(null);
	const [creatingAgent, setCreatingAgent] = React.useState(false);
	const [deletingAgent, setDeletingAgent] = React.useState<number | null>(null);
	const [agentForm, setAgentForm] = React.useState({
		name: "",
		title: "",
		system_prompt: "",
		model: "gemini-2.0-flash-exp",
		temperature: 1,
		max_output_tokens: 1000,
	});

	const handleCreateAgent = async () => {
		if (!agentForm.name.trim()) return;
		setCreatingAgent(true);
		try {
			const avatar_url = getRandomAvatar(agentForm.name);
			await dbHelpers.createAgent({
				...agentForm,
				avatar_url,
			});
			setAgentForm({
				name: "",
				title: "",
				system_prompt: "",
				model: "gemini-2.0-flash-exp",
				temperature: 1,
				max_output_tokens: 1000,
			});
		} catch (error) {
			console.error("Error creating agent:", error);
		} finally {
			setCreatingAgent(false);
		}
	};

	const handleUpdateAgent = async (agentId: number) => {
		if (!agentForm.name.trim()) return;
		setEditingAgent(agentId);
		try {
			await dbHelpers.updateAgent(agentId, agentForm);
			setEditingAgent(null);
		} catch (error) {
			console.error("Error updating agent:", error);
		}
	};

	const handleDeleteAgent = async (agentId: number) => {
		setDeletingAgent(agentId);
		try {
			await dbHelpers.deleteAgent(agentId);
			setDeletingAgent(null);
		} catch (error) {
			console.error("Error deleting agent:", error);
			setDeletingAgent(null);
		}
	};

	const startEdit = (agent: any) => {
		setEditingAgent(agent.id);
		setAgentForm({
			name: agent.name,
			title: agent.title,
			system_prompt: agent.system_prompt,
			model: agent.model,
			temperature: agent.temperature,
			max_output_tokens: agent.max_output_tokens,
		});
	};

	const cancelEdit = () => {
		setEditingAgent(null);
		setAgentForm({
			name: "",
			title: "",
			system_prompt: "",
			model: "gemini-2.0-flash-exp",
			temperature: 1,
			max_output_tokens: 1000,
		});
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center h-32">
				<Loader className="animate-spin" size={24} />
			</div>
		);
	}

	if (error) {
		return (
			<div className="text-red-500 text-center py-8">
				Error loading agents: {error}
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Create New Agent */}
			<div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4">
				<h3 className="text-lg font-semibold mb-4 text-neutral-800 dark:text-neutral-100">
					Create New Agent
				</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label className="block text-sm text-neutral-600 dark:text-neutral-300 mb-2">
							Name
						</label>
						<input
							type="text"
							className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400 transition"
							placeholder="Agent name"
							value={agentForm.name}
							onChange={(e) =>
								setAgentForm({
									...agentForm,
									name: e.target.value,
								})
							}
						/>
					</div>
					<div>
						<label className="block text-sm text-neutral-600 dark:text-neutral-300 mb-2">
							Title
						</label>
						<input
							type="text"
							className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400 transition"
							placeholder="e.g., Developer, Designer"
							value={agentForm.title}
							onChange={(e) =>
								setAgentForm({
									...agentForm,
									title: e.target.value,
								})
							}
						/>
					</div>
					<div className="md:col-span-2">
						<label className="block text-sm text-neutral-600 dark:text-neutral-300 mb-2">
							System Prompt
						</label>
						<textarea
							className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400 transition resize-none"
							placeholder="Define the agent's personality and behavior..."
							rows={3}
							value={agentForm.system_prompt}
							onChange={(e) =>
								setAgentForm({
									...agentForm,
									system_prompt: e.target.value,
								})
							}
						/>
					</div>
					<div>
						<label className="block text-sm text-neutral-600 dark:text-neutral-300 mb-2">
							Model
						</label>
						<select
							className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400 transition"
							value={agentForm.model}
							onChange={(e) =>
								setAgentForm({
									...agentForm,
									model: e.target.value,
								})
							}
						>
							<option value="gemini-2.0-flash-exp">Gemini 2.0 Flash</option>
							<option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
							<option value="claude-3-5-sonnet-20241022">
								Claude 3.5 Sonnet
							</option>
							<option value="gpt-4o">GPT-4o</option>
						</select>
					</div>
					<div>
						<label className="block text-sm text-neutral-600 dark:text-neutral-300 mb-2">
							Temperature
						</label>
						<input
							type="range"
							min="0"
							max="2"
							step="0.1"
							className="w-full"
							value={agentForm.temperature}
							onChange={(e) =>
								setAgentForm({
									...agentForm,
									temperature: parseFloat(e.target.value),
								})
							}
						/>
						<div className="text-xs text-neutral-500 mt-1">
							{agentForm.temperature} (0 = focused, 2 = creative)
						</div>
					</div>
				</div>
				<button
					onClick={handleCreateAgent}
					disabled={creatingAgent || !agentForm.name.trim()}
					className="mt-4 px-4 py-2 bg-neutral-900 dark:bg-neutral-100 text-neutral-100 dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors flex items-center gap-2 disabled:opacity-50"
				>
					{creatingAgent ? (
						<Loader size={16} className="animate-spin" />
					) : (
						<Plus size={16} />
					)}
					{creatingAgent ? "Creating..." : "Create Agent"}
				</button>
			</div>

			{/* Agents List */}
			<div>
				<h3 className="text-lg font-semibold mb-4 text-neutral-800 dark:text-neutral-100">
					All Agents ({agents.length})
				</h3>
				<div className="space-y-3">
					{agents.map((agent) => (
						<div
							key={agent.id}
							className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4"
						>
							{editingAgent === agent.id ? (
								<div className="space-y-3">
									<div className="flex items-center gap-3">
										<Avatar src={agent.avatar_url} size={40} />
										<div className="flex-1">
											<input
												type="text"
												className="w-full rounded border border-neutral-300 dark:border-neutral-700 bg-transparent px-2 py-1 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400 transition"
												value={agentForm.name}
												onChange={(e) =>
													setAgentForm({
														...agentForm,
														name: e.target.value,
													})
												}
											/>
										</div>
									</div>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
										<div>
											<label className="block text-xs text-neutral-600 dark:text-neutral-300 mb-1">
												Title
											</label>
											<input
												type="text"
												className="w-full rounded border border-neutral-300 dark:border-neutral-700 bg-transparent px-2 py-1 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400 transition"
												value={agentForm.title}
												onChange={(e) =>
													setAgentForm({
														...agentForm,
														title: e.target.value,
													})
												}
											/>
										</div>
										<div>
											<label className="block text-xs text-neutral-600 dark:text-neutral-300 mb-1">
												Model
											</label>
											<select
												className="w-full rounded border border-neutral-300 dark:border-neutral-700 bg-transparent px-2 py-1 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400 transition"
												value={agentForm.model}
												onChange={(e) =>
													setAgentForm({
														...agentForm,
														model: e.target.value,
													})
												}
											>
												<option value="gemini-2.0-flash-exp">
													Gemini 2.0 Flash
												</option>
												<option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
												<option value="claude-3-5-sonnet-20241022">
													Claude 3.5 Sonnet
												</option>
												<option value="gpt-4o">GPT-4o</option>
											</select>
										</div>
									</div>
									<div>
										<label className="block text-xs text-neutral-600 dark:text-neutral-300 mb-1">
											System Prompt
										</label>
										<textarea
											className="w-full rounded border border-neutral-300 dark:border-neutral-700 bg-transparent px-2 py-1 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400 transition resize-none"
											rows={2}
											value={agentForm.system_prompt}
											onChange={(e) =>
												setAgentForm({
													...agentForm,
													system_prompt: e.target.value,
												})
											}
										/>
									</div>
									<div className="flex gap-2">
										<button
											onClick={() => handleUpdateAgent(agent.id!)}
											className="px-3 py-1 bg-neutral-900 dark:bg-neutral-100 text-neutral-100 dark:text-neutral-900 rounded text-sm hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors flex items-center gap-1"
										>
											<Save size={14} />
											Save
										</button>
										<button
											onClick={cancelEdit}
											className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 rounded text-sm hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors flex items-center gap-1"
										>
											<X size={14} />
											Cancel
										</button>
									</div>
								</div>
							) : (
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										<Avatar
											src={agent.avatar_url}
											size={40}
											className="flex-shrink-0"
										/>
										<div>
											<div className="font-medium text-neutral-900 dark:text-neutral-100">
												{agent.name}
											</div>
											<div className="text-sm text-neutral-500 dark:text-neutral-400">
												{agent.title} • {agent.model}
											</div>
											{agent.system_prompt && (
												<div className="text-xs text-neutral-400 dark:text-neutral-500 mt-1 line-clamp-2">
													{agent.system_prompt}
												</div>
											)}
										</div>
									</div>
									<div className="flex gap-2">
										<button
											onClick={() => startEdit(agent)}
											className="p-2 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
										>
											<Edit size={16} />
										</button>
										<button
											onClick={() => handleDeleteAgent(agent.id!)}
											disabled={deletingAgent === agent.id}
											className="p-2 text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
										>
											{deletingAgent === agent.id ? (
												<Loader size={16} className="animate-spin" />
											) : (
												<Trash2 size={16} />
											)}
										</button>
									</div>
								</div>
							)}
						</div>
					))}
					{agents.length === 0 && (
						<div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
							No agents created yet. Create your first agent above.
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

function AboutSection() {
	return (
		<div className="text-neutral-600 dark:text-neutral-300">
			{/* App Icon and Title */}
			<div className="flex items-center gap-4 mb-6">
				<div className="flex items-center justify-center">
					<Image
						src="/android-icon-192x192.png"
						alt="NakaChat"
						width={64}
						height={64}
						className="mask mask-squircle"
					/>
				</div>
				<div>
					<div
						className={`text-2xl font-light text-neutral-800 dark:text-neutral-200 ${sawarabi.className}`}
					>
						NakaChat
					</div>
					<div className="text-sm text-neutral-500 dark:text-neutral-400">
						Version 1.0.0
					</div>
				</div>
			</div>

			{/* Social Links */}
			<div className="mb-6">
				<div className="flex gap-3">
					<a
						href="https://github.com/nakachat"
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-center gap-2 px-3 py-2 text-sm bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
					>
						<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
							<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
						</svg>
						GitHub
					</a>
					<a
						href="https://twitter.com/nakachat"
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-center gap-2 px-3 py-2 text-sm bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
					>
						<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
							<path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
						</svg>
						Twitter
					</a>
					<a
						href="https://discord.gg/nakachat"
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-center gap-2 px-3 py-2 text-sm bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
					>
						<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
							<path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.019 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1568 2.4189Z" />
						</svg>
						Discord
					</a>
				</div>
			</div>

			{/* Description */}
			<div className="mb-6 flex flex-col gap-2">
				<p className="text-md leading-relaxed">
					This was originally built in a Hackathon by{" "}
					<Link
						href="https://github.com/rivertwilight"
						target="_blank"
						rel="noopener noreferrer"
						className="text-orange-600 dark:text-orange-400 hover:text-orange-500 dark:hover:text-orange-100 transition-colors"
					>
						@Rene
					</Link>{" "}
					and
					<Link
						href="https://github.com/fallingsakura"
						target="_blank"
						rel="noopener noreferrer"
						className="text-orange-600 dark:text-orange-400 hover:text-orange-500 dark:hover:text-orange-100 transition-colors"
					>
						{" "}
						@Ficon
					</Link>
				</p>
				<p className="text-md leading-relaxed">
					We&apos;d like to thank the following open source projects for their
					contributions to NakaChat:
				</p>
			</div>

			{/* Open Source Acknowledgments */}
			<div className="mb-4">
				<div className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
					{OPEN_SOURCE_PROJECTS.map((project) => (
						<a
							key={project.repo}
							href={`https://github.com/${project.repo}`}
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-2 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
						>
							{project.icon === "lobe" ? (
								<Image
									src="https://lobehub.com/favicon.ico"
									alt="Lobe"
									width={12}
									height={12}
									className="w-3 h-3"
								/>
							) : (
								<svg
									className="w-3 h-3"
									fill="currentColor"
									viewBox="0 0 24 24"
								>
									<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
								</svg>
							)}
							<span>{project.repo}</span>
						</a>
					))}
				</div>
			</div>
		</div>
	);
}

interface SettingsDialogProps {
	open: boolean;
	onClose: () => void;
	initialTab?: string;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({
	open,
	onClose,
	initialTab = "general",
}) => {
	const [selectedTab, setSelectedTab] = React.useState(initialTab);

	// Update selected tab when initialTab prop changes
	React.useEffect(() => {
		setSelectedTab(initialTab);
	}, [initialTab]);
	return (
		<Dialog open={open} onClose={onClose} variant="modal">
			<div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
				<h2
					className={`${sawarabi.className} text-2xl text-neutral-800 dark:text-neutral-100 tracking-wide`}
				>
					Settings
				</h2>
			</div>

			<div className="flex h-[600px] max-h-[75vh] w-[900px]">
				{/* Sidebar Navigation */}
				<nav className="w-56 sm:w-64 py-8 px-4 flex flex-col gap-2 bg-white dark:bg-neutral-900 select-none">
					{sidebarNav.map((item) => (
						<button
							key={item.key}
							onClick={() => setSelectedTab(item.key)}
							className={`text-left rounded-lg px-3 py-2 text-md font-medium transition-colors text-neutral-700 dark:text-neutral-200 tracking-wide hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:outline-none ${
								selectedTab === item.key
									? "bg-neutral-100 dark:bg-neutral-800 font-semibold"
									: "bg-transparent"
							}`}
							type="button"
						>
							{item.label}
						</button>
					))}
				</nav>
				{/* Main Content */}
				<div className="flex-1 overflow-y-auto p-6">
					<div className="w-full max-w-2xl mx-auto">
						<form className="flex flex-col gap-4">
							{selectedTab === "general" && <GeneralSection />}
							{selectedTab === "model" && <ModelSection />}
							{selectedTab === "agents" && <AgentsSection />}
							{selectedTab === "about" && <AboutSection />}
						</form>
					</div>
				</div>
			</div>
		</Dialog>
	);
};

export default SettingsDialog;
