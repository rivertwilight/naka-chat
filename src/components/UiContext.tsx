import React, { createContext, useContext, useState, useCallback } from "react";

interface UiContextType {
  isSettingsPanelOpen: boolean;
  openSettingsPanel: (initialTab?: string) => void;
  closeSettingsPanel: () => void;
  toggleSettingsPanel: () => void;
  settingsInitialTab: string;
  isSidebarOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
}

const UiContext = createContext<UiContextType | undefined>(undefined);

export const UiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState("general");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const openSettingsPanel = useCallback((initialTab?: string) => {
    if (initialTab) {
      setSettingsInitialTab(initialTab);
    }
    setIsSettingsPanelOpen(true);
  }, []);
  const closeSettingsPanel = useCallback(() => setIsSettingsPanelOpen(false), []);
  const toggleSettingsPanel = useCallback(() => setIsSettingsPanelOpen((v) => !v), []);

  const openSidebar = useCallback(() => setIsSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setIsSidebarOpen((v) => !v), []);

  return (
    <UiContext.Provider
      value={{
        isSettingsPanelOpen,
        openSettingsPanel,
        closeSettingsPanel,
        toggleSettingsPanel,
        settingsInitialTab,
        isSidebarOpen,
        openSidebar,
        closeSidebar,
        toggleSidebar,
      }}
    >
      {children}
    </UiContext.Provider>
  );
};

export function useUiContext() {
  const ctx = useContext(UiContext);
  if (!ctx) throw new Error("useUiContext must be used within a UiProvider");
  return ctx;
} 
