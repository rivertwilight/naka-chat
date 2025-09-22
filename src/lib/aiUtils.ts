import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText } from "ai";
import { GoogleGenAI } from "@google/genai";
import { ProviderType } from "@/components/PersistanceContext";

export interface ProviderConfig {
	provider: ProviderType;
	apiKey: string;
	baseUrl?: string;
	modelId?: string;
}

export async function callAI(
	prompt: string,
	modelId: string,
	providerConfig: ProviderConfig
): Promise<string> {
	switch (providerConfig.provider) {
		case "Google":
			try {
				const ai = new GoogleGenAI({
					apiKey: providerConfig.apiKey,
				});
				const googleResponse = await ai.models.generateContent({
					model: modelId || "gemini-2.5-pro",
					contents: [{ role: "user", parts: [{ text: prompt }] }],
				});
				return googleResponse.text || "";
			} catch (error) {
				console.error("AI call error:", error);
				console.error(
					"Error message:",
					`*${providerConfig.provider} is having trouble responding right now. Please try again later.*`
				);
				return "";
			}
		case "OpenAI":
			throw new Error("OpenAI provider not implemented yet");
		case "Anthropic":
			throw new Error("Anthropic provider not implemented yet");
		case "Moonshot":
			try {
				const provider = createOpenAICompatible({
					name: "Moonshot",
					baseURL: "https://api.moonshot.cn/v1",
					apiKey: providerConfig.apiKey,
				});
				const model = provider(modelId || "kimi-latest");
				const response = await generateText({
					model: model,
					prompt,
				});
				return response.text || "";
			} catch (error) {
				console.error("AI call error:", error);
				console.error(
					"Error message:",
					`*${providerConfig.provider} is having trouble responding right now. Please try again later.*`
				);
				return "";
			}
		case "Custom":
			try {
				const provider = createOpenAICompatible({
					name: "Custom",
					baseURL: providerConfig.baseUrl!,
					apiKey: providerConfig.apiKey,
				});
				const model = provider(modelId);
				const response = await generateText({
					model: model,
					prompt,
				});
				return response.text || "";
			} catch (error) {
				console.error("AI call error:", error);
				console.error(
					"Error message:",
					`*${providerConfig.provider} is having trouble responding right now. Please try again later.*`
				);
				return "";
			}
		case "NakaChat":
			try {
				const provider = createOpenAICompatible({
					name: "NakaChat",
					baseURL: "https://api.siliconflow.cn/v1",
					apiKey: process.env.FREE_TRIAL_API_KEY!,
				});
				const model = provider(modelId);
				const response = await generateText({
					model: model,
					prompt,
				});
				return response.text || "";
			} catch (error) {
				console.error("AI call error:", error);
				console.error(
					"Error message:",
					`*${providerConfig.provider} is having trouble responding right now. Please try again later.*`
				);
				return "";
			}
		default:
			throw new Error(`Unsupported provider: ${providerConfig.provider}`);
	}
}
