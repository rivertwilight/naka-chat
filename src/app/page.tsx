import HomeClient from "./HomeClient";

export const metadata = {
	title: "NakaChat - Group Chat with AI Agents",
	description:
		"Group Chat with AI. Brainstorming, Mock Interview, COC, Werewolf, and more.",
	keywords: [
		"NakaChat",
		"Group Chat",
		"AI Agents",
		"Brainstorming",
		"Mock Interview",
	],
	openGraph: {
		title: "NakaChat - Group Chat with AI Agents",
		description:
			"Group Chat with AI. Brainstorming, Mock Interview, COC, Werewolf, and more.",
		images: ["/og-image.png"],
	},
};

export default function Page() {
	return <HomeClient />;
}
