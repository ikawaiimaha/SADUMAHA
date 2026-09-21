import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SignaturePanel } from '../src/components/common/dashboard/SignaturePanel';

test('SignaturePanel shows both UAE PASS and global e-sign flows', () => {
  const html = renderToStaticMarkup(
    <SignaturePanel
      titleEn="Digital Authorization"
      titleAr="التفويض الرقمي"
      lang="en"
      onUaePass={() => undefined}
      onGlobalEcdsa={() => undefined}
    />
  );

  assert.match(html, /Sign with UAE PASS/i);
  assert.match(html, /Global Secure e-Signature/i);
  assert.match(html, /encrypted passport verification/i);
});
