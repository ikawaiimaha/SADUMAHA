export const isLocalPreview = (hostname: string) => ['localhost', '127.0.0.1', '[::1]'].includes(hostname);
export const journeyPaths = ['/', '/journey', '/rehearsal'];
export const pausedPaths = ['/pilot', '/join', '/artist/register', '/roster', '/gallery-consignment', '/workbench'];
export const normalizePreviewPath = (path: string) => path.replace(/\/+$/, '') || '/';
