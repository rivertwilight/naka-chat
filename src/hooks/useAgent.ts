/**
 * useAgent.ts
 * Custom hook to interact with AI models using OpenAI-compatible API
 * @param id - The ID of the AI model to use
 * @returns An object containing the model and a function to generate text
 */
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText } from "ai";
export default function useAgent({ id }: { id: string }) {
	const provider = createOpenAICompatible({
		name: "AI Hub Mix",
		baseURL: process.env.PROVIDER_BASE_URL!,
		apiKey: process.env.PROVIDER_API_KEY,
	});
	const model = provider(id);
	return {
		model,
		/**
		 *
		 * @param prompt - The text prompt to generate a response for
		 * @description Generates text using the specified AI model
		 * @returns A promise that resolves to the generated text
		 * @example
		 * ```ts
		 * const { text } = await generateText(prompt)
		 * ```
		 * @reference https://ai-sdk.dev/docs/reference/ai-sdk-core/generate-text#text
		 */
		generateText: async (prompt: string) => {
			return await generateText({ model, prompt });
		},
	};
}
