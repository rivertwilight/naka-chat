import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Sawarabi_Mincho } from "next/font/google";

const sawarabi = Sawarabi_Mincho({
	weight: "400",
	subsets: ["latin"],
});

const mockGroups = [
	{ id: 1, name: "AI Researchers" },
	{ id: 2, name: "Design Team" },
	{ id: 3, name: "Friends" },
];

const mockMessages = [
	{
		id: 1,
		sender: "Yuki",
		content: "おはようございます！How is everyone today?",
		time: "09:01",
	},
	{
		id: 2,
		sender: "Alex",
		content: "Good morning! Working on the new UI proposal.",
		time: "09:02",
	},
	{
		id: 3,
		sender: "Mina",
		content: "Let me know if you need any design assets.",
		time: "09:03",
	},
	{
		id: 4,
		sender: "Yuki",
		content: "Thank you, Mina!",
		time: "09:04",
	},
];

export default function GroupPage({ params }: { params: { id: string } }) {
	const groupId = Number(params.id);
	const currentGroup = mockGroups.find((g) => g.id === groupId);
	if (!currentGroup) notFound();

	return (
		<div className="min-h-screen flex bg-white dark:bg-neutral-900 font-sans">
			{/* Sidebar */}
			<aside className="w-56 sm:w-64 flex-shrink-0 px-4 py-8 bg-white dark:bg-neutral-900 flex flex-col gap-2 justify-between">
				<nav className="flex flex-col gap-1">
					{mockGroups.map((group) => (
						<Link
							key={group.id}
							href={`/group/${group.id}`}
							className={`text-left px-3 py-2 rounded-lg bg-transparent transition-colors text-neutral-800 dark:text-neutral-200 focus:outline-none hover:bg-neutral-100 dark:hover:bg-neutral-800 ${
								group.id === groupId
									? "font-semibold bg-neutral-100 dark:bg-neutral-800"
									: ""
							}`}
						>
							{group.name}
						</Link>
					))}
				</nav>
				<div className="mt-8 text-center select-none">
					<span
						className={`${sawarabi.className} text-2xl text-neutral-700 dark:text-neutral-200 tracking-wide`}
					>
						NakaChat
					</span>
				</div>
			</aside>
			{/* Chat Area */}
			<main className="flex-1 flex flex-col justify-end px-0 sm:px-8 py-8 bg-white dark:bg-neutral-900">
				<section className="flex-1 flex flex-col justify-end gap-4 max-w-2xl mx-auto w-full">
					<div className="flex flex-col gap-4">
						{mockMessages.map((msg) => (
							<div key={msg.id} className="flex flex-col gap-1">
								<span className="text-xs text-neutral-500 dark:text-neutral-400">
									{msg.sender}{" "}
									<span className="ml-2 text-[10px]">
										{msg.time}
									</span>
								</span>
								<span className="text-base text-neutral-900 dark:text-neutral-100 whitespace-pre-line">
									{msg.content}
								</span>
							</div>
						))}
					</div>
				</section>
				{/* Input area placeholder */}
				<div className="mt-8 flex items-center gap-2 max-w-2xl mx-auto w-full">
					<input
						type="text"
						className="flex-1 px-4 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none"
						placeholder="Type a message..."
						disabled
					/>
					<button
						className="px-4 py-2 rounded-lg bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400 cursor-not-allowed"
						disabled
					>
						Send
					</button>
				</div>
			</main>
		</div>
	);
}
