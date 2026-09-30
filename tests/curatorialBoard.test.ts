import test from "node:test";
import assert from "node:assert/strict";
import {
  applyLedger,
  capacity,
  ledgerSeed,
  type LedgerCommand,
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
    /Committee approval/,
  );
  f.act("Committee", {
    action: "CURATE_COMMITTEE_APPROVE",
    id: "proposal",
    revision: 1,
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
  assert.equal(f.s.curation!.nominations[0].status, "COMMITTEE_APPROVED");
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
  f.act("Committee", {
    action: "CURATE_COMMITTEE_APPROVE",
    id: "second",
    revision: 2,
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
    action: "CURATE_COMMITTEE_APPROVE",
    id: "proposal",
    revision: 1,
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
    action: "CURATE_COMMITTEE_APPROVE",
    id: "proposal",
    revision: 2,
  });
  f.act("Director", { action: "CURATE_ENDORSE" });
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
