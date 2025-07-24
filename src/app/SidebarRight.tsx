 "use client";
import React from "react";
import { ArrowRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Member {
  name: string;
  role: string;
}

interface SidebarRightProps {
  members: Member[];
}

const SidebarRight: React.FC<SidebarRightProps> = ({ members }) => {
  const [selectedMember, setSelectedMember] = React.useState<null | Member>(null);

  return (
    <aside className="hidden md:flex flex-col gap-4 w-56 sm:w-64 h-screen fixed right-0 top-0 z-20 px-4 py-8 select-none">
      <AnimatePresence initial={false} mode="wait">
        {!selectedMember ? (
          <motion.ul
            key="list"
            initial={{ x: 64, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 64, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 40 }}
            className="flex flex-col gap-2"
          >
            {members.map((member) => (
              <button
                key={member.name}
                className="flex flex-col items-start group relative px-2 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-left"
                onClick={() => setSelectedMember(member)}
                style={{ outline: "none", border: "none", background: "none" }}
              >
                <span className="text-neutral-900 dark:text-neutral-100 font-medium flex items-center">
                  {member.name}
                  <span className="ml-2 relative flex items-center">
                    <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  </span>
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">{member.role}</span>
              </button>
            ))}
          </motion.ul>
        ) : (
          <motion.div
            key="detail"
            initial={{ x: 64, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 64, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 40 }}
            className="relative h-full flex flex-col"
          >
            <button
              className="absolute top-0 right-0 m-2 p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              onClick={() => setSelectedMember(null)}
              aria-label="Close"
            >
              <X size={20} />
            </button>
            <div className="flex flex-col items-center justify-center flex-1 gap-2">
              <span className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{selectedMember.name}</span>
              <span className="text-sm text-neutral-500 dark:text-neutral-400">{selectedMember.role}</span>
              {/* Add more member details here if needed */}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
};

export default SidebarRight;
