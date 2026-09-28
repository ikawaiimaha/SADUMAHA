/** Reveal submission feedback immediately, including nested workspace scrolling. */
export function scrollWorkspaceToTop() {
  const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';
  window.scrollTo({ top: 0, behavior });
  document.getElementById('workspace-scroll')?.scrollTo({ top: 0, behavior });
}
