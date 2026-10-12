import test from "node:test";
import assert from "node:assert/strict";
import {
  applyLedger,
  capacity,
  ledgerSeed,
  restoreLedger,
  type LedgerCommand,
  type LedgerJournalEvent,
} from "../src/lib/spatialLedger";
function fixture() {
  let state = ledgerSeed();
  return {
    get s() {
      return state;
    },
    act(role: string, command: Omit<LedgerCommand, "expected">, id = role) {
      state = applyLedger(
        state,
        { id, role, exhibitionId: "sandbox" },
        { ...command, expected: state.version },
        "approved-theme",
      );
    },
  };
}
const brief = {
  action: "CURATE_CREATE_SLOTS" as const,
  id: "brief",
  galleryId: "gallery-a",
  quantity: 1,
  areaM2: 10,
  budgetMinor: 100000,
  coordinatorId: "coordinator-a",
  brief: "Classical calligraphy with clear links to continuity of practice.",
};
const proposal = {
  action: "CURATE_PROPOSE" as const,
  id: "proposal",
  slotId: "brief:1",
  artistId: "case-mounir-fatmi",
  areaM2: 8,
  costMinor: 80000,
  fit: "The proposed work explains shared artistic practice.",
  evidence: "Synthetic dossier reference 01.",
};
const MINUTE = "Committee minute: recommend endorsement of this revision.";
function locked() {
  const f = prepared();
  f.act("Exhibition_Coordinator", proposal, "coordinator-a");
  f.act("General_Exhibition_Coordinator", {
    action: "CURATE_SHORTLIST",
    id: "proposal",
    revision: 1,
  });
  f.act("General_Exhibition_Coordinator", {
    action: "CURATE_LOCK",
    id: "board-1",
  });
  return f;
}
function prepared(quantity = 1) {
  const f = fixture();
  f.act("Director", { action: "AUTHORIZE_BLOCK" });
  f.act("General_Exhibition_Coordinator", { ...brief, quantity });
  return f;
}
test("briefs reserve slot capacity and budgets once; proposals cannot bypass assignments or limits", () => {
  const f = prepared();
  assert.deepEqual(capacity(f.s, "gallery-a"), { works: 1, m2: 20 });
  assert.throws(
    () =>
      f.act("Committee", {
        action: "APPROVE",
        targetId: proposal.artistId,
        galleryId: "gallery-b",
      }),
    /Defense Board/,
  );
  assert.throws(
    () => f.act("Exhibition_Coordinator", proposal, "coordinator-b"),
    /assigned/,
  );
  assert.throws(
    () =>
      f.act(
        "Exhibition_Coordinator",
        { ...proposal, areaM2: 11 },
        "coordinator-a",
      ),
    /within the brief/,
  );
  f.act("Exhibition_Coordinator", proposal, "coordinator-a");
  assert.deepEqual(capacity(f.s, "gallery-a"), { works: 1, m2: 20 });
  assert.throws(
    () =>
      f.act("General_Exhibition_Coordinator", {
        ...brief,
        id: "oversized",
        quantity: 2,
      }),
    /accommodate/,
  );
  assert.equal(f.s.curation!.slots.length, 1);
  assert.throws(
    () =>
      f.act("General_Exhibition_Coordinator", {
        ...brief,
        id: "expensive",
        galleryId: "gallery-b",
        budgetMinor: 15000001,
      }),
    /budget/,
  );
});
test("reason-bearing returns preserve prior revisions and require proposer response", () => {
  const f = prepared();
  f.act("Exhibition_Coordinator", proposal, "coordinator-a");
  assert.throws(
    () =>
      f.act("General_Exhibition_Coordinator", {
        action: "CURATE_RETURN",
        id: "proposal",
        revision: 1,
        reason: "Does not fit thematic brief",
        note: "",
      }),
    /specific note/,
  );
  f.act("General_Exhibition_Coordinator", {
    action: "CURATE_RETURN",
    id: "proposal",
    revision: 1,
    reason: "Evidence insufficient",
    note: "Please cite the studio availability confirmation.",
  });
  assert.throws(
    () =>
      f.act(
        "Exhibition_Coordinator",
        { ...proposal, revision: 1 },
        "coordinator-a",
      ),
    /specific response/,
  );
  f.act(
    "Exhibition_Coordinator",
    {
      ...proposal,
      revision: 1,
      response: "Added a dated studio confirmation reference.",
      evidence: "Synthetic studio confirmation 02.",
    },
    "coordinator-a",
  );
  assert.equal(f.s.curation!.nominations[0].revisions.length, 2);
  assert.equal(
    f.s.curation!.nominations[0].revisions[0].evidence,
    proposal.evidence,
  );
  assert.throws(
    () =>
      f.act("General_Exhibition_Coordinator", {
        action: "CURATE_SHORTLIST",
        id: "proposal",
        revision: 1,
      }),
    /current submitted revision/,
  );
});
test("Committee objections reopen only one slot; Director endorses an exact complete board", () => {
  const f = prepared(2);
  f.act("Exhibition_Coordinator", proposal, "coordinator-a");
  f.act(
    "Exhibition_Coordinator",
    {
      ...proposal,
      id: "second",
      slotId: "brief:2",
      artistId: "case-murat-kurt",
    },
    "coordinator-a",
  );
  for (const id of ["proposal", "second"])
    f.act("General_Exhibition_Coordinator", {
      action: "CURATE_SHORTLIST",
      id,
      revision: 1,
    });
  f.act("General_Exhibition_Coordinator", {
    action: "CURATE_LOCK",
    id: "board-1",
  });
  assert.throws(
    () => f.act("Director", { action: "CURATE_ENDORSE" }),
    /recommendation minute/,
  );
  f.act("Committee", {
    action: "CURATE_COMMITTEE_RECOMMEND",
    id: "proposal",
    revision: 1,
    note: MINUTE,
  });
  f.act("Committee", {
    action: "CURATE_RETURN",
    id: "second",
    revision: 1,
    reason: "Evidence insufficient",
    note: "Clarify the proposed work availability.",
  });
  assert.equal(f.s.curation!.slots[0].selectedId, "proposal");
  assert.equal(f.s.curation!.slots[1].selectedId, null);
  assert.equal(f.s.curation!.nominations[0].status, "SHORTLISTED");
  assert.equal(f.s.curation!.recommendations!.length, 1);
  f.act(
    "Exhibition_Coordinator",
    {
      ...proposal,
      id: "second",
      slotId: "brief:2",
      artistId: "case-murat-kurt",
      revision: 1,
      response: "Availability confirmed in the attached source reference.",
    },
    "coordinator-a",
  );
  f.act("General_Exhibition_Coordinator", {
    action: "CURATE_SHORTLIST",
    id: "second",
    revision: 2,
  });
  f.act("General_Exhibition_Coordinator", {
    action: "CURATE_LOCK",
    id: "board-2",
  });
  // The first recommendation was bound to board-1 and cannot authorize board-2.
  assert.throws(
    () => f.act("Director", { action: "CURATE_ENDORSE" }),
    /recommendation minute/,
  );
  for (const [id, revision] of [
    ["proposal", 1],
    ["second", 2],
  ] as const)
    f.act("Committee", {
      action: "CURATE_COMMITTEE_RECOMMEND",
      id,
      revision,
      note: MINUTE,
    });
  f.act("Director", { action: "CURATE_ENDORSE" });
  assert.equal(f.s.curation!.phase, "ENDORSED");
  assert.equal(f.s.artworks[0].state, "APPROVED");
  assert.equal(f.s.artworks[0].technicalVersion, null);
  assert.deepEqual(capacity(f.s, "gallery-a"), { works: 0, m2: 10 });
  assert.equal(f.s.curation!.snapshots[0].rows[1].revision.number, 1);
  assert.equal(f.s.curation!.snapshots[1].rows[1].revision.number, 2);
  assert.throws(
    () =>
      f.act("General_Exhibition_Coordinator", {
        ...brief,
        id: "after-lock",
        galleryId: "gallery-b",
      }),
    /locked/,
  );
});
test("venue loss keeps endorsed snapshot but reopens affected brief, blocking reassignment bypass", () => {
  const f = prepared();
  f.act("Exhibition_Coordinator", proposal, "coordinator-a");
  f.act("General_Exhibition_Coordinator", {
    action: "CURATE_SHORTLIST",
    id: "proposal",
    revision: 1,
  });
  f.act("General_Exhibition_Coordinator", {
    action: "CURATE_LOCK",
    id: "board",
  });
  f.act("Committee", {
    action: "CURATE_COMMITTEE_RECOMMEND",
    id: "proposal",
    revision: 1,
    note: MINUTE,
  });
  f.act("Director", { action: "CURATE_ENDORSE" });
  f.act("Director", {
    action: "CLOSE_SPACE",
    targetId: "gallery-a",
    reason: "Sample venue closure",
  });
  assert.equal(f.s.curation!.phase, "DRAFT");
  assert.equal(f.s.artworks[0].state, "LOCATION_ORPHANED");
  assert.equal(f.s.curation!.snapshots[0].state, "ENDORSED");
  assert.throws(
    () =>
      f.act("General_Exhibition_Coordinator", {
        action: "REASSIGN",
        targetId: proposal.artistId,
        galleryId: "gallery-b",
        reason: "Move the artwork",
      }),
    /Defense Board/,
  );
  f.act("General_Exhibition_Coordinator", {
    action: "CURATE_MOVE_SLOT",
    slotId: "brief:1",
    galleryId: "gallery-b",
    note: "Move to the remaining suitable gallery.",
  });
  f.act(
    "Exhibition_Coordinator",
    {
      ...proposal,
      revision: 1,
      response: "Revised proposal for the replacement gallery.",
    },
    "coordinator-a",
  );
  f.act("General_Exhibition_Coordinator", {
    action: "CURATE_SHORTLIST",
    id: "proposal",
    revision: 2,
  });
  f.act("General_Exhibition_Coordinator", {
    action: "CURATE_LOCK",
    id: "replacement",
  });
  f.act("Committee", {
    action: "CURATE_COMMITTEE_RECOMMEND",
    id: "proposal",
    revision: 2,
    note: MINUTE,
  });
  f.act("Director", { action: "CURATE_ENDORSE" });
  assert.equal(f.s.curation!.recommendations!.length, 2);
  assert.equal(f.s.curation!.recommendations![0].revision, 1);
  assert.equal(f.s.artworks[0].galleryId, "gallery-b");
  f.act("General_Exhibition_Coordinator", {
    action: "WITHDRAW",
    targetId: proposal.artistId,
    reason: "Artist withdrew from the fictional edition.",
  });
  assert.equal(f.s.curation!.phase, "DRAFT");
  assert.equal(f.s.curation!.slots[0].selectedId, null);
  assert.equal(f.s.curation!.snapshots.at(-1)!.state, "ENDORSED");
  assert.equal(f.s.artworks[0].state, "WITHDRAWN");
});
test("a Committee recommendation is an attributed minute only; it cannot grant executive approval", () => {
  const f = locked();
  assert.throws(
    () =>
      f.act("Committee", {
        action: "CURATE_COMMITTEE_RECOMMEND",
        id: "proposal",
        revision: 1,
        note: "short",
      }),
    /recommendation minute/,
  );
  assert.throws(
    () =>
      f.act("Director", {
        action: "CURATE_COMMITTEE_RECOMMEND",
        id: "proposal",
        revision: 1,
        note: MINUTE,
      }),
    /another role/,
  );
  assert.throws(
    () => f.act("Committee", { action: "CURATE_COMMITTEE_APPROVE" } as never),
    /Unknown curatorial action/,
  );
  f.act("Committee", {
    action: "CURATE_COMMITTEE_RECOMMEND",
    id: "proposal",
    revision: 1,
    note: MINUTE,
  });
  const rec = f.s.curation!.recommendations![0];
  assert.deepEqual(
    [rec.actorId, rec.role, rec.proposalId, rec.revision, rec.snapshotId],
    ["Committee", "Committee", "proposal", 1, "board-1"],
  );
  assert.equal(rec.minute, MINUTE);
  assert.equal(f.s.curation!.nominations[0].status, "SHORTLISTED");
  assert.equal(f.s.artworks[0].state, "UNASSIGNED");
  assert.equal(f.s.curation!.phase, "DIRECTOR_REVIEW");
  assert.throws(
    () =>
      f.act("Committee", {
        action: "CURATE_COMMITTEE_RECOMMEND",
        id: "proposal",
        revision: 1,
        note: MINUTE,
      }),
    /already has/,
  );
  assert.throws(
    () => f.act("Committee", { action: "CURATE_ENDORSE" }),
    /another role/,
  );
  f.act("Director", { action: "CURATE_ENDORSE" });
  assert.equal(f.s.artworks[0].state, "APPROVED");
  assert.equal(f.s.curation!.nominations[0].status, "ENDORSED");
});
test("a stale recommendation cannot authorize a changed revision or a re-locked board", () => {
  // Two slots: the first recommendation leaves the board in COMMITTEE_REVIEW,
  // so the Committee's existing return path is authorized (no permission change).
  const f = prepared(2);
  f.act("Exhibition_Coordinator", proposal, "coordinator-a");
  f.act(
    "Exhibition_Coordinator",
    {
      ...proposal,
      id: "second",
      slotId: "brief:2",
      artistId: "case-murat-kurt",
    },
    "coordinator-a",
  );
  for (const id of ["proposal", "second"])
    f.act("General_Exhibition_Coordinator", {
      action: "CURATE_SHORTLIST",
      id,
      revision: 1,
    });
  f.act("General_Exhibition_Coordinator", {
    action: "CURATE_LOCK",
    id: "board-1",
  });
  f.act("Committee", {
    action: "CURATE_COMMITTEE_RECOMMEND",
    id: "proposal",
    revision: 1,
    note: MINUTE,
  });
  assert.equal(f.s.curation!.phase, "COMMITTEE_REVIEW");
  f.act("Committee", {
    action: "CURATE_RETURN",
    id: "proposal",
    revision: 1,
    reason: "Evidence insufficient",
    note: "Cite the studio availability confirmation.",
  });
  f.act(
    "Exhibition_Coordinator",
    {
      ...proposal,
      revision: 1,
      response: "Added a dated studio confirmation reference.",
    },
    "coordinator-a",
  );
  f.act("General_Exhibition_Coordinator", {
    action: "CURATE_SHORTLIST",
    id: "proposal",
    revision: 2,
  });
  f.act("General_Exhibition_Coordinator", {
    action: "CURATE_LOCK",
    id: "board-2",
  });
  assert.equal(f.s.curation!.recommendations!.length, 1);
  assert.throws(
    () => f.act("Director", { action: "CURATE_ENDORSE" }),
    /recommendation minute/,
  );
  assert.throws(
    () =>
      f.act("Committee", {
        action: "CURATE_COMMITTEE_RECOMMEND",
        id: "proposal",
        revision: 1,
        note: MINUTE,
      }),
    /locked proposal/,
  );
  assert.equal(f.s.artworks[0].state, "UNASSIGNED");
  for (const [id, revision] of [
    ["proposal", 2],
    ["second", 1],
  ] as const)
    f.act("Committee", {
      action: "CURATE_COMMITTEE_RECOMMEND",
      id,
      revision,
      note: MINUTE,
    });
  f.act("Director", { action: "CURATE_ENDORSE" });
  assert.equal(f.s.artworks[0].state, "APPROVED");
});
test("in Director review the Committee may object only to a proposal that has no current minute", () => {
  const f = locked();
  f.s.curation!.nominations[0].status = "COMMITTEE_APPROVED"; // legacy board
  f.s.curation!.phase = "DIRECTOR_REVIEW";
  const objection = {
    action: "CURATE_RETURN" as const,
    id: "proposal",
    revision: 1,
    reason: "Evidence insufficient" as const,
    note: "The legacy approval lacks a documented rationale.",
  };
  assert.throws(
    () => f.act("Director", { ...objection }),
    /(another role|not awaiting)/,
  );
  f.act("Committee", objection);
  assert.equal(f.s.curation!.nominations[0].status, "RETURNED");
  assert.equal(f.s.curation!.nominations[0].feedback.length, 1);
  assert.equal(f.s.curation!.phase, "DRAFT");
  // Once a minute exists the Director owns the decision; the Committee cannot retract it.
  const g = locked();
  g.act("Committee", {
    action: "CURATE_COMMITTEE_RECOMMEND",
    id: "proposal",
    revision: 1,
    note: MINUTE,
  });
  assert.equal(g.s.curation!.phase, "DIRECTOR_REVIEW");
  assert.throws(() => g.act("Committee", objection), /not on the Committee board/);
});
test("a saved session journal with the old Committee approval replays as recorded; live use stays refused", () => {
  const actor = (role: string, id = role) => ({
    id,
    role,
    exhibitionId: "sandbox",
  });
  const events: LedgerJournalEvent[] = [];
  let state = ledgerSeed();
  const step = (role: string, command: Omit<LedgerCommand, "expected">, id = role) => {
    const full = { ...command, expected: state.version } as LedgerCommand;
    const at = "2026-10-01T00:00:00.000Z";
    state = applyLedger(state, actor(role, id), full, "approved-theme", at, true);
    events.push({ actor: actor(role, id), command: full, themeApprovalId: "approved-theme", at });
  };
  step("Director", { action: "AUTHORIZE_BLOCK" });
  step("General_Exhibition_Coordinator", brief);
  step("Exhibition_Coordinator", proposal, "coordinator-a");
  step("General_Exhibition_Coordinator", { action: "CURATE_SHORTLIST", id: "proposal", revision: 1 });
  step("General_Exhibition_Coordinator", { action: "CURATE_LOCK", id: "board-1" });
  step("Committee", { action: "CURATE_COMMITTEE_APPROVE", id: "proposal", revision: 1 } as never);
  const original = JSON.stringify(events);
  const restored = restoreLedger(JSON.parse(original));
  assert.equal(JSON.stringify(events), original, "the saved journal is never rewritten");
  assert.equal(restored.curation!.nominations[0].status, "COMMITTEE_APPROVED");
  assert.equal(restored.curation!.phase, "DIRECTOR_REVIEW");
  assert.equal(restored.curation!.recommendations, undefined, "no minute is fabricated");
  assert.equal(restored.decisions.at(-1)!.action, "CURATE_COMMITTEE_APPROVE");
  // Live commands cannot use the historic action, and the Director still needs a real minute.
  assert.throws(
    () =>
      applyLedger(restored, actor("Committee"), { action: "CURATE_COMMITTEE_APPROVE", id: "proposal", revision: 1, expected: restored.version } as never, "approved-theme"),
    /Unknown curatorial action/,
  );
  assert.throws(
    () => applyLedger(restored, actor("Director"), { action: "CURATE_ENDORSE", expected: restored.version }, "approved-theme"),
    /recommendation/,
  );
  // The recovery path: a real, attributed minute appended to the retained history.
  const recovered = applyLedger(restored, actor("Committee"), { action: "CURATE_COMMITTEE_RECOMMEND", id: "proposal", revision: 1, note: MINUTE, expected: restored.version }, "approved-theme");
  assert.equal(recovered.curation!.recommendations!.length, 1);
  assert.equal(recovered.curation!.nominations[0].status, "COMMITTEE_APPROVED");
  // A journal that already recorded the Director's old endorsement still reads back.
  const endorsedEvents = [...events, { actor: actor("Director"), command: { action: "CURATE_ENDORSE", expected: restored.version } as LedgerCommand, themeApprovalId: "approved-theme", at: "2026-10-02T00:00:00.000Z" }];
  assert.equal(restoreLedger(endorsedEvents).curation!.nominations[0].status, "ENDORSED");
});
test("legacy COMMITTEE_APPROVED records stay intact; no minute is fabricated and the Director waits for a real one", () => {
  const f = locked();
  const b = f.s.curation!;
  b.nominations[0].status = "COMMITTEE_APPROVED"; // as saved by the previous version
  b.phase = "DIRECTOR_REVIEW";
  const before = JSON.stringify(b.nominations[0].revisions);
  assert.equal(b.recommendations, undefined);
  assert.throws(
    () => f.act("Director", { action: "CURATE_ENDORSE" }),
    /recommendation/,
  );
  assert.equal(f.s.curation!.nominations[0].status, "COMMITTEE_APPROVED");
  assert.equal(f.s.curation!.recommendations, undefined);
  f.act("Committee", {
    action: "CURATE_COMMITTEE_RECOMMEND",
    id: "proposal",
    revision: 1,
    note: MINUTE,
  });
  assert.equal(f.s.curation!.nominations[0].status, "COMMITTEE_APPROVED");
  assert.equal(JSON.stringify(f.s.curation!.nominations[0].revisions), before);
  assert.equal(f.s.curation!.snapshots.length, 1);
  f.act("Director", { action: "CURATE_ENDORSE" });
  assert.equal(f.s.curation!.nominations[0].status, "ENDORSED");
});
