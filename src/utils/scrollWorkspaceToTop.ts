/** Reveal submission feedback immediately, including nested workspace scrolling. */
export function scrollWorkspaceToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  document.getElementById('workspace-scroll')?.scrollTo({ top: 0, behavior: 'smooth' });
}
