"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, MessageCircle, Sparkles } from "lucide-react";
import { Sawarabi_Mincho } from "next/font/google";

interface Agent {
	id: string;
	name: string;
	title: string;
	avatar_url: string;
	description: string;
	color: string;
}

const defaultAgents: Agent[] = [
	{
		id: "1",
		name: "Maya",
		title: "Product Manager",
		avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=maya",
		description: "Strategic planning & user needs",
		color: "from-amber-50 to-amber-100",
	},
	{
		id: "2",
		name: "Zara",
		title: "UX/UI Designer",
		avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=zara",
		description: "Creative design & user experience",
		color: "from-purple-50 to-purple-100",
	},
	{
		id: "3",
		name: "Sam",
		title: "Full-Stack Developer",
		avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=sam",
		description: "Technical implementation & architecture",
		color: "from-blue-50 to-blue-100",
	},
	{
		id: "4",
		name: "Kai",
		title: "Data Scientist",
		avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=kai",
		description: "Analytics & machine learning insights",
		color: "from-emerald-50 to-emerald-100",
	},
	{
		id: "5",
		name: "Luna",
		title: "Content Strategist",
		avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=luna",
		description: "Storytelling & brand messaging",
		color: "from-rose-50 to-rose-100",
	},
	{
		id: "6",
		name: "Ravi",
		title: "DevOps Engineer",
		avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=ravi",
		description: "Infrastructure & deployment automation",
		color: "from-indigo-50 to-indigo-100",
	},
	{
		id: "7",
		name: "Aria",
		title: "Marketing Specialist",
		avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=aria",
		description: "Growth strategies & audience engagement",
		color: "from-cyan-50 to-cyan-100",
	},
	{
		id: "8",
		name: "Finn",
		title: "Security Expert",
		avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=finn",
		description: "Cybersecurity & compliance",
		color: "from-red-50 to-red-100",
	},
	{
		id: "9",
		name: "Nova",
		title: "QA Engineer",
		avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=nova",
		description: "Testing & quality assurance",
		color: "from-lime-50 to-lime-100",
	},
	{
		id: "10",
		name: "Echo",
		title: "Business Analyst",
		avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=echo",
		description: "Requirements & process optimization",
		color: "from-orange-50 to-orange-100",
	},
];

const sawarabi = Sawarabi_Mincho({
	weight: "400",
	subsets: ["latin"],
});

export default function HomePage() {
	const [input, setInput] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	const agents = defaultAgents;
	const redirectTo = "/group/1";

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!input.trim()) return;

		setIsLoading(true);

		// Default behavior: redirect after loading
		setTimeout(() => {
			router.push(redirectTo);
		}, 800);
	};

	return (
		<div className="min-h-screen flex flex-col justify-center items-center">
			<div className="container mx-auto px-4 py-16">
				{/* Header */}
				<div className="text-center mb-16">
					<div className="flex items-center justify-center mb-6">
						<div className="relative">
							<MessageCircle className="w-12 h-12 text-neutral-700 dark:text-neutral-300" />
							<Sparkles className="w-6 h-6 text-amber-500 absolute -top-2 -right-2 animate-pulse" />
						</div>
					</div>
					<h1
						className={`text-3xl md:text-4xl font-light text-neutral-800 dark:text-neutral-200 mb-4 ${sawarabi.className}`}
					>
						NakaChat
					</h1>
					<p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed">
						Collaborate with AI agents in a harmonious group chat experience.
						Each agent brings unique expertise to your conversations.
					</p>
				</div>

				{/* Agent Cards */}
				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-10 max-w-4xl mx-auto">
					{[...Array(9)].map((_, index) => {
						const agent = agents[index];
						return (
							<div
								key={index}
								className={
									"group flex flex-row items-center bg-neutral-50 dark:bg-neutral-800 rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-500 min-h-[64px] h-[72px] max-h-[80px]"
								}
								style={{ animationDelay: `${index * 100}ms` }}
							>
								{agent ? (
									<>
										<div className="relative mr-3 flex-shrink-0">
											<img
												src={agent.avatar_url}
												alt={agent.name}
												className="w-12 h-12 rounded-full border-2 border-white dark:border-neutral-700 shadow group-hover:scale-105 transition-transform duration-300"
											/>
										</div>
										<div className="flex flex-col justify-center min-w-0 flex-1">
											<h3 className="text-base font-medium text-neutral-800 dark:text-neutral-200 truncate">
												{agent.name}
											</h3>
											<p className="text-xs font-medium text-neutral-600 dark:text-neutral-400 truncate">
												{agent.title}
											</p>
											<p className="text-xs text-neutral-500 dark:text-neutral-500 leading-tight truncate">
												{agent.description}
											</p>
										</div>
										<div className="ml-3 flex items-center">
											<input
												type="checkbox"
												className="w-5 h-5 appearance-none rounded-full border-2 border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 checked:bg-amber-400 checked:border-3 focus:ring-amber-400 transition-colors duration-200"
											/>
										</div>
									</>
								) : (
									<div className="w-12 h-12 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center opacity-50 mr-3" />
								)}
							</div>
						);
					})}
				</div>

				<div className="flex justify-center mb-4">
					<button
						onClick={() => router.push(redirectTo)}
						className="flex border-amber-500 hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950 border-2 text-neutral-800 dark:text-neutral-200 items-center gap-2 px-6 py-2 rounded-xl text-base font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
					>
						Start Group Chat
						<ArrowRight className="w-4 h-4" />
					</button>
				</div>
			</div>
		</div>
	);
}

// 为了保持向后兼容，导出一个默认的 Home 组件
export function Home() {
	return <HomePage />;
}
