// Whitespace-delimited counts of the displayed sample text in either script.
export const calculateDynamicWordCount = (text: string | null | undefined) => text?.trim().split(/\s+/u).filter(Boolean).length ?? 0;
export const calculateGatePercentage = (completed: number, total: number) => total > 0 && Number.isFinite(completed) && Number.isFinite(total) ? Math.round(Math.max(0, Math.min(completed, total)) / total * 100) : 0;
