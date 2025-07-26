import React, { createContext, useContext, useEffect, useState } from "react";

export type ProviderType = "Google" | "Anthropic" | "OpenAI" | "Custom";

interface PersistanceSettings {
  provider: ProviderType;
  apiKey: string;
  baseUrl: string;
  firstName: string;
  lastName: string;
  modelId: string;
  setProvider: (provider: ProviderType) => void;
  setApiKey: (apiKey: string) => void;
  setBaseUrl: (baseUrl: string) => void;
  setFirstName: (firstName: string) => void;
  setLastName: (lastName: string) => void;
  setModelId: (modelId: string) => void;
}

const PersistanceContext = createContext<PersistanceSettings | undefined>(
  undefined,
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
  const [provider, setProvider] = useState<ProviderType>("OpenAI");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [modelId, setModelId] = useState("");

  // Load from localStorage on mount
  useEffect(() => {
    const initial = getInitialSettings();
    if (initial) {
      setProvider(initial.provider || "OpenAI");
      setApiKey(initial.apiKey || "");
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
        apiKey,
        baseUrl,
        firstName,
        lastName,
        modelId,
      }),
    );
  }, [provider, apiKey, baseUrl, firstName, lastName, modelId]);

  return (
    <PersistanceContext.Provider
      value={{
        provider,
        apiKey,
        baseUrl,
        firstName,
        lastName,
        modelId,
        setProvider,
        setApiKey,
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
