import React from 'react';
import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { I18nProvider } from '../src/context/I18nContext';
import DirectorWorkspace from '../src/components/DirectorWorkspace';
import { isThemeBatchComplete, type CommitteeThemeDraft } from '../src/components/CommitteeThemeWorkspace';

const proposal: CommitteeThemeDraft = {
  arabicName: 'ثيمة حقيقية', englishName: '', aestheticFramework: 'الإطار الجمالي',
  contemporaryRelevance: 'المبررات المعاصرة', curatorialJustification: 'المبررات الفنية',
};
const valid = [1, 2, 3].map(i => ({ ...proposal, arabicName: `${proposal.arabicName} ${i}` }));
function render(themes?: CommitteeThemeDraft[], locked = false) {
  return renderToStaticMarkup(<I18nProvider initialLang="en"><DirectorWorkspace submittedThemes={themes} nominatedArtists={[]} onVetoArtist={() => {}}
    ratifiedTheme={locked ? proposal : null} /></I18nProvider>);
}
function presentationDisabled(html: string) {
  const button = html.match(/<button\b[^>]*>(?:(?!<\/button>)[\s\S])*Present 3 Themes to Chairman[\s\S]*?<\/button>/)?.[0];
  assert.ok(button, 'presentation action exists');
  return /disabled=""/.test(button);
}

test('Director never supplies fixtures for absent, short, oversized or incomplete batches', () => {
  const batches = [undefined, [], valid.slice(0, 1), valid.slice(0, 2), [...valid, proposal],
    ...(['arabicName', 'aestheticFramework', 'contemporaryRelevance', 'curatorialJustification'] as const)
      .map(field => [valid[0], valid[1], { ...valid[2], [field]: '  ' }])];
  for (const batch of batches) {
    assert.equal(isThemeBatchComplete(batch ?? []), false);
    const html = render(batch);
    assert.equal(presentationDisabled(html), true);
    assert.doesNotMatch(html, /Calligraphic Manifestations|Echoes of the Reed|The Kinetic Letter/);
    if (batch?.length === 2) assert.doesNotMatch(html, /ثيمة حقيقية 3/);
  }
});

test('three Arabic-only proposals are eligible until Chairman ratification', () => {
  assert.equal(isThemeBatchComplete(valid), true);
  assert.equal(presentationDisabled(render(valid)), false);
  assert.equal(presentationDisabled(render(valid, true)), true);
});
