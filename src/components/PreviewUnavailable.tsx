import React from 'react';

export default function PreviewUnavailable({ review = false, notFound = false }: { review?: boolean; notFound?: boolean }) {
  return <main className="min-h-screen bg-[#F7F1E6] text-[#111817] ps-5 pe-5 py-12" lang="en" dir="ltr">
    <section className="mx-auto max-w-2xl rounded-xl border border-[#D9CEBA] bg-white p-6 space-y-5">
      <p className="font-serif text-2xl text-[#8B261E]">SADU · Private preview</p>
      <h1 className="text-3xl font-semibold">{notFound ? 'Page not found' : review ? 'Advanced review is available locally' : 'This module is paused'}</h1>
      <p>{notFound ? 'This address does not match a SADU preview page.' : review ? 'The two-tier review, wall planner, label generator and crate tracking use the local rehearsal service. They are not connected to this hosted preview.' : 'The authenticated pilot and earlier operational workspaces are outside the current fictional release. No institutional accounts or external integrations have been activated.'}</p>
      {!notFound && <p>You can complete the fictional 14-task journey here, including specialist evidence, recorded decisions and all three sample payment stages.</p>}
      <nav className="flex flex-wrap gap-4" aria-label="Available preview pages">
        <a className="rounded bg-[#8B261E] text-white ps-4 pe-4 py-3 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2" href="/journey">Open the fictional journey</a>
        <a className="underline ps-2 pe-2 py-3" href="/overview">View the presentation</a>
      </nav>
      {review && <p className="text-sm">For a demonstration of the advanced tools, use the local rehearsal on the development computer. Its records are separate from this browser checklist.</p>}
    </section>
  </main>;
}
