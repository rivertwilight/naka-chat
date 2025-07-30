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
		"Multi-agent",
	],
	openGraph: {
		title: "NakaChat - Group Chat with AI Agents",
		description:
			"Group Chat with AI. Brainstorming, Mock Interview, COC, Werewolf, and more.",
		images: ["/og.png"],
	},
	twitter: {
		card: "summary_large_image",
		title: "NakaChat - Group Chat with AI Agents",
		description:
			"Group Chat with AI. Brainstorming, Mock Interview, COC, Werewolf, and more.",
		images: ["/og.png"],
	},
};

export default function Page() {
	const jsonLd = {
		"@context": "https://schema.org",
		"@graph": [
			{
				"@type": "WebApplication",
				"@id": "https://naka.chat/#webapp",
				name: "NakaChat",
				description:
					"Group Chat with AI. Brainstorming, Mock Interview, COC, Werewolf, and more.",
				url: "https://naka.chat",
				applicationCategory: "CommunicationApplication",
				operatingSystem: "Web Browser",
				browserRequirements: "Requires JavaScript. Requires HTML5.",
				featureList: [
					"AI-powered group chat",
					"Multi-agent collaboration",
					"Brainstorming sessions",
					"Mock interview simulations",
					"Call of Cthulhu (COC) gaming",
					"Werewolf game scenarios",
					"Real-time messaging",
					"Japanese Kanso design aesthetic",
				],
				offers: {
					"@type": "Offer",
					price: "0",
					priceCurrency: "USD",
				},
				author: {
					"@type": "Person",
					name: "YGeeker",
				},
				datePublished: "2024-01-01",
				softwareVersion: "1.0.0",
			},
			{
				"@type": "Person",
				"@id": "https://naka.chat/#developer",
				name: "YGeeker",
				description: "Developer of NakaChat - AI-powered group chat platform",
				knowsAbout: [
					"Artificial Intelligence",
					"Web Development",
					"Multi-agent Systems",
					"Gaming Applications",
					"Collaborative Tools",
				],
			},
			{
				"@type": "SoftwareApplication",
				"@id": "https://naka.chat/#software",
				name: "NakaChat",
				description:
					"A modern web application for AI-powered group conversations and collaborative scenarios",
				applicationCategory: "CommunicationApplication",
				operatingSystem: "Web Browser",
				softwareVersion: "1.0.0",
				datePublished: "2024-01-01",
				author: {
					"@type": "Person",
					name: "YGeeker",
				},
			},
		],
	};

	return (
		<>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
			/>
			<HomeClient />
		</>
	);
}
