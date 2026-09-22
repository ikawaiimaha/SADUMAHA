import mixpanel from 'mixpanel-browser';

const mixpanelToken = import.meta.env.VITE_MIXPANEL_TOKEN as string | undefined;
let mixpanelReady = false;

if (mixpanelToken) {
  mixpanel.init(mixpanelToken, {
    debug: import.meta.env.DEV,
    track_pageview: true,
    persistence: 'localStorage',
  });
  mixpanelReady = true;
}

export const trackEvent = (eventName: string, properties?: Record<string, unknown>) => {
  if (mixpanelReady) mixpanel.track(eventName, properties);
};

export const identifyUser = (roleKey: string) => {
  if (!mixpanelReady) return;
  mixpanel.identify(roleKey);
  mixpanel.people.set({
    '$name': roleKey,
    'Account Type': 'Institutional',
  });
};
