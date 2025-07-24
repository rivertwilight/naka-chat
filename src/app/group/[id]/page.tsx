import React from "react";
import { notFound } from "next/navigation";
import { Geist_Mono } from "next/font/google";
import { Markdown } from "@lobehub/ui";
import GroupInputArea from "./GroupInputArea";
import MessageItem from "./MessageItem";

const geistMono = Geist_Mono({
	weight: ["400"],
	subsets: ["latin"],
});

const mockMessages = [
	{
		id: 1,
		sender: "Yuki",
		content: `おはようございます！How is everyone today?\n\nHere's today's agenda:\n\n- Review last week's progress\n- Discuss new research papers\n- Plan next steps`,
		time: "09:01",
		reactions: [
			{ emoji: "👍", count: 2 },
			{ emoji: "😊", count: 1 },
		],
	},
	{
		id: 2,
		sender: "Alex",
		content: `Good morning! Here's a code snippet for the new UI proposal:\n\n\`\`\`tsx\nfunction KansoButton() {\n  return <button className="kanso">Kanso</button>;\n}\`\`\`\n\nLet me know your thoughts.`,
		time: "09:02",
	},
	{
		id: 3,
		sender: "Mina",
		content: `@Alex The code looks great!\n\n**Design assets** are available [here](https://figma.com).\n\n- [x] Logo\n- [ ] Color palette\n- [ ] Icons`,
		time: "09:03",
		reactions: [{ emoji: "❤️", count: 1 }],
	},
	{
		id: 4,
		sender: "Yuki",
		content: `Thank you, Mina!\n\nLet's aim to finish the color palette by tomorrow. 😊`,
		time: "09:04",
		reactions: [],
	},
	{
		id: 5,
		sender: "Alex",
		content: `Sounds good!\n\n "Simplicity is the ultimate sophistication." — Leonardo da Vinci`,
		time: "09:05",
		reactions: [{ emoji: "😊", count: 1 }],
	},
	{
		id: 6,
		sender: "You",
		content: `Thanks everyone! I'll work on the color palette today. 🙏`,
		time: "09:06",
		reactions: [{ emoji: "🙏", count: 2 }],
	},
];

export default async function GroupPage({
	params,
}: {
	params: { id: string };
}) {
	const { id } = await params;
	const groupId = Number(id);
	if (![1, 2, 3].includes(groupId)) notFound();

	return (
		<main className="flex-1 flex flex-col justify-end px-0 sm:px-8 py-8 relative min-h-screen">
			<section className="flex-1 flex flex-col justify-end gap-0 max-w-2xl mx-auto w-full pb-24">
				<div className="flex flex-col">
					{mockMessages.map((msg, idx) => (
						<React.Fragment key={msg.id}>
							<MessageItem
								sender={msg.sender}
								time={msg.time}
								content={msg.content}
								geistMono={geistMono}
								idx={idx}
								reactions={msg.reactions || []}
							/>
						</React.Fragment>
					))}
				</div>
			</section>
			<GroupInputArea />
		</main>
	);
}
