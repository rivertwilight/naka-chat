export function formatTimestamp(date: Date): string {
	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
	const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
	
	const timeString = date.toLocaleTimeString([], { 
		hour: '2-digit', 
		minute: '2-digit',
		hour12: false 
	});
	
	if (messageDate.getTime() === today.getTime()) {
		// Today: 12:24
		return timeString;
	} else if (messageDate.getTime() === yesterday.getTime()) {
		// Yesterday: 12:24 Yesterday
		return `${timeString} Yesterday`;
	} else {
		// Older: 12:24 25 July
		const dayMonth = date.toLocaleDateString([], { 
			day: 'numeric', 
			month: 'long' 
		});
		return `${timeString} ${dayMonth}`;
	}
} 
