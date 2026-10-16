export const isLocalPreview = (hostname: string) => ['localhost', '127.0.0.1', '[::1]'].includes(hostname);
export const journeyPaths = ['/', '/journey', '/rehearsal'];
// The Nominations pilot is open on the hosted preview too: it sits behind the preview password and its own sign-in.
export const pilotPaths = ['/pilot', '/intro'];
export const pausedPaths = ['/join', '/artist/register', '/roster', '/gallery-consignment', '/workbench'];
export const normalizePreviewPath = (path: string) => path.replace(/\/+$/, '') || '/';
