import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export type DialogVariant = "fullscreen" | "modal";

interface DialogProps {
	open: boolean;
	onClose: () => void;
	children: React.ReactNode;
	className?: string;
	showCloseButton?: boolean;
	variant?: DialogVariant;
}

const Dialog: React.FC<DialogProps> = ({
	open,
	onClose,
	children,
	className = "",
	showCloseButton = true,
	variant = "fullscreen"
}) => {
	React.useEffect(() => {
		if (!open) return;
		const onEsc = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("keydown", onEsc);
		return () => document.removeEventListener("keydown", onEsc);
	}, [open, onClose]);

	return (
		<AnimatePresence>
			{open &&
				(variant === "fullscreen" ? (
					<motion.div
						className="fixed inset-0 z-90 bg-white dark:bg-neutral-900 flex flex-col"
						initial={{ x: "100%" }}
						animate={{ x: 0 }}
						exit={{ x: "100%" }}
						transition={{
							type: "tween",
							ease: [0.25, 0.1, 0.25, 1],
							duration: 0.3
						}}
					>
						{showCloseButton && (
							<button
								className="absolute top-4 right-4 p-2 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
								onClick={onClose}
								aria-label="Close dialog"
								type="button"
							>
								<X size={24} />
							</button>
						)}
						{children}
					</motion.div>
				) : (
					<motion.div
						className="fixed inset-0 z-50 flex items-center justify-center"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
					>
						{/* Overlay */}
						<div
							className="absolute inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm"
							onClick={onClose}
						/>
						{/* Dialog content */}
						<motion.div
							className={`relative bg-white dark:bg-neutral-900 rounded-xl shadow-xl p-0 sm:p-0 w-full max-w-lg mx-4 ${className}`}
							initial={{ y: 40, opacity: 0 }}
							animate={{ y: 0, opacity: 1 }}
							exit={{ y: 40, opacity: 0 }}
							transition={{ type: "tween", duration: 0.25 }}
							onClick={(e) => e.stopPropagation()}
						>
							{showCloseButton && (
								<button
									className="absolute top-3 right-3 p-2 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
									onClick={onClose}
									aria-label="Close dialog"
									type="button"
								>
									<X size={20} />
								</button>
							)}
							{children}
						</motion.div>
					</motion.div>
				))}
		</AnimatePresence>
	);
};

export default Dialog;
