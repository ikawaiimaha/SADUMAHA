export function agreementPipelineReady(themeStatus: string, guidelinesStatus: string, isIsolatedRehearsalMode = false): boolean {
  return isIsolatedRehearsalMode || (themeStatus === 'PUBLISHED_OFFICIAL' && guidelinesStatus === 'PUBLISHED');
}
