"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Send, Sparkles } from "lucide-react";

const agents = [
	{
		id: 1,
		name: "Maya",
		title: "Product Manager",
		avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=maya",
		description: "Strategic planning & user needs",
		color: "from-amber-50 to-amber-100",
	},
	{
		id: 2,
		name: "Zara",
		title: "UX/UI Designer",
		avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=zara",
		description: "Creative design & user experience",
		color: "from-purple-50 to-purple-100",
	},
	{
		id: 3,
		name: "Sam",
		title: "Full-Stack Developer",
		avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sam",
		description: "Technical implementation & architecture",
		color: "from-blue-50 to-blue-100",
	},
];

export default function Home() {
	const [input, setInput] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!input.trim()) return;

		setIsLoading(true);

		// Simulate a brief loading state for smooth UX
		setTimeout(() => {
			router.push("/group/1");
		}, 800);
	};

	return (
		<div className="min-h-screen">
			<div className="container mx-auto px-4 py-16">
				{/* Header */}
				<div className="text-center mb-16">
					<div className="flex items-center justify-center mb-6">
						<div className="relative">
							<MessageCircle className="w-12 h-12 text-neutral-700 dark:text-neutral-300" />
							<Sparkles className="w-6 h-6 text-amber-500 absolute -top-2 -right-2 animate-pulse" />
						</div>
					</div>
					<h1 className="text-4xl md:text-6xl font-light text-neutral-800 dark:text-neutral-200 mb-4">
						Naka Chat
					</h1>
					<p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed">
						Collaborate with AI agents in a harmonious group chat experience.
						Each agent brings unique expertise to your conversations.
					</p>
				</div>

				{/* Agent Cards */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 max-w-4xl mx-auto">
					{agents.map((agent, index) => (
						<div
							key={agent.id}
							className={`group relative bg-gradient-to-br ${agent.color} dark:from-neutral-800 dark:to-neutral-700 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-500 transform hover:-translate-y-1`}
							style={{ animationDelay: `${index * 200}ms` }}
						>
							<div className="flex flex-col items-center text-center">
								<div className="relative mb-4">
									<img
										src={agent.avatar}
										alt={agent.name}
										className="w-20 h-20 rounded-full border-4 border-white dark:border-neutral-700 shadow-lg group-hover:scale-105 transition-transform duration-300"
									/>
									<div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white dark:border-neutral-700 flex items-center justify-center">
										<div className="w-2 h-2 bg-white rounded-full"></div>
									</div>
								</div>
								<h3 className="text-xl font-medium text-neutral-800 dark:text-neutral-200 mb-1">
									{agent.name}
								</h3>
								<p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
									{agent.title}
								</p>
								<p className="text-xs text-neutral-500 dark:text-neutral-500 leading-relaxed">
									{agent.description}
								</p>
							</div>
						</div>
					))}
				</div>

				{/* Input Section */}
				<div className="max-w-2xl mx-auto">
					<div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-700 p-6">
						<form onSubmit={handleSubmit} className="space-y-4">
							<div className="text-center mb-6">
								<h2 className="text-2xl font-light text-neutral-800 dark:text-neutral-200 mb-2">
									Start Your Conversation
								</h2>
								<p className="text-sm text-neutral-600 dark:text-neutral-400">
									Ask anything and let our AI team collaborate to help you
								</p>
							</div>

							<div className="relative">
								<textarea
									value={input}
									onChange={(e) => setInput(e.target.value)}
									placeholder="Describe your project, ask a question, or share an idea..."
									className="w-full h-24 px-4 py-3 text-neutral-800 dark:text-neutral-200 bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-300 placeholder-neutral-500 dark:placeholder-neutral-400"
									disabled={isLoading}
								/>
								<button
									type="submit"
									disabled={!input.trim() || isLoading}
									className="absolute bottom-3 right-3 p-2 bg-amber-500 hover:bg-amber-600 disabled:bg-neutral-300 dark:disabled:bg-neutral-600 text-white rounded-lg transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
								>
									{isLoading ? (
										<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
									) : (
										<Send className="w-5 h-5" />
									)}
								</button>
							</div>
						</form>
					</div>
				</div>

				{/* Footer */}
				<div className="text-center mt-16">
					<p className="text-sm text-neutral-500 dark:text-neutral-400">
						Experience the power of collaborative AI conversations
					</p>
				</div>
			</div>
		</div>
	);
}
