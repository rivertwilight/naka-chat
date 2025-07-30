import React, { createContext, useContext, useEffect, useState } from "react";

export type ProviderType =
	| "Google"
	| "Anthropic"
	| "OpenAI"
	| "Moonshot"
	| "Custom"
	| "FreeTrial";

interface PersistanceSettings {
	provider: ProviderType;
	apiKeys: Record<ProviderType, string>;
	baseUrl: string;
	firstName: string;
	lastName: string;
	modelId: string;
	setProvider: (provider: ProviderType) => void;
	setApiKey: (provider: ProviderType, apiKey: string) => void;
	getApiKey: (provider: ProviderType) => string;
	setBaseUrl: (baseUrl: string) => void;
	setFirstName: (firstName: string) => void;
	setLastName: (lastName: string) => void;
	setModelId: (modelId: string) => void;
}

const PersistanceContext = createContext<PersistanceSettings | undefined>(
	undefined
);

const STORAGE_KEY = "naka-chat-settings";

function getInitialSettings() {
	if (typeof window === "undefined") return null;
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (raw) return JSON.parse(raw);
	} catch {}
	return null;
}

export const PersistanceProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [provider, setProvider] = useState<ProviderType>("FreeTrial");
	const [apiKeys, setApiKeys] = useState<Record<ProviderType, string>>({
		Google: "",
		Anthropic: "",
		OpenAI: "",
		Moonshot: "",
		Custom: "",
		FreeTrial: "",
	});
	const [baseUrl, setBaseUrl] = useState("");
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [modelId, setModelId] = useState("");
	const freeTrialKey: string = process.env.NEXT_PUBLIC_FREE_TRIAL_KEY || "";

	// Load from localStorage on mount
	useEffect(() => {
		const initial = getInitialSettings();
		if (initial) {
			setProvider(initial.provider);
			// Handle migration from old single apiKey format
			if (initial.apiKey && !initial.apiKeys) {
				setApiKeys({
					Google: "",
					Anthropic: "",
					OpenAI: initial.apiKey,
					Moonshot: "",
					Custom: "",
					FreeTrial: freeTrialKey,
				});
			} else {
				setApiKeys(
					initial.apiKeys || {
						Google: "",
						Anthropic: "",
						OpenAI: "",
						Custom: "",
						FreeTrial: freeTrialKey,
					}
				);
			}
			setBaseUrl(initial.baseUrl || "");
			setFirstName(initial.firstName || "");
			setLastName(initial.lastName || "");
			setModelId(initial.modelId || "");
		}
	}, []);

	// Save to localStorage on change
	useEffect(() => {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				provider,
				apiKeys,
				baseUrl,
				firstName,
				lastName,
				modelId,
			})
		);
	}, [provider, apiKeys, baseUrl, firstName, lastName, modelId]);

	const setApiKey = (providerType: ProviderType, apiKey: string) => {
		setApiKeys((prev) => ({
			...prev,
			[providerType]: apiKey,
		}));
	};

	const getApiKey = (providerType: ProviderType) => {
		return apiKeys[providerType] || "";
	};

	return (
		<PersistanceContext.Provider
			value={{
				provider,
				apiKeys,
				baseUrl,
				firstName,
				lastName,
				modelId,
				setProvider,
				setApiKey,
				getApiKey,
				setBaseUrl,
				setFirstName,
				setLastName,
				setModelId,
			}}
		>
			{children}
		</PersistanceContext.Provider>
	);
};

export function usePersistance() {
	const ctx = useContext(PersistanceContext);
	if (!ctx)
		throw new Error("usePersistance must be used within PersistanceProvider");
	return ctx;
}
