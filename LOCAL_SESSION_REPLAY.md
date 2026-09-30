# Local demo replay

rrweb starts after the private preview gate is verified, only on localhost/loopback
and the synthetic `/review`, `/journey`, `/rehearsal`, `/overview` and `/` routes.
It never starts on the Vercel hostname, `/pilot` or `/workbench`.

Use **Stop & export recording** in the preview header when the demo ends. The
browser downloads `sadu-demo-<timestamp>.json` to its configured download location.
No account, API key, upload API, third-party script, network/console recorder or
cloud analytics service is used. LogRocket was removed; Clarity was not added.

The JSON contains rrweb DOM/mouse/click/scroll events and custom markers for
selected connected-workflow state changes and acquisition results. It does not
capture audio, every React hook, Redux state, or automatically classify hesitation.
There is no Redux store in this connected journey. Input values, passwords, images,
iframes, canvases and `data-private` elements are masked/blocked. Visible synthetic
page text is recorded. Do not reuse the demo recorder with actual personal data.

The recording stays in tab memory until export. Navigation/reload can discard it;
export first. Recording stops at an 8 MB serialized-event limit and preserves the
captured portion for export. After export, reload for a new session. The browser
may prompt for a download location. The retained JSON uses `format: sadu-rrweb-v1`;
its `events` array can be loaded by a local rrweb Replayer. No hosted player is used.

Build with `npm run build:rehearsal`, then run the existing connected local server.
The SDK is bundled locally and dynamically loaded only on eligible pages.
