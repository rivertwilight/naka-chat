import React from "react";

const GroupInputArea = () => (
  <div className="fixed left-56 sm:left-0 right-0 bottom-0 py-4 px-0 sm:px-8 z-30">
    <div className="flex items-center gap-2 max-w-2xl mx-auto w-full">
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
  </div>
);

export default GroupInputArea; 
