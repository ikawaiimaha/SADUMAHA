import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  applyLedger,
  ledgerSeed,
  capacity,
  alternatives,
  downstreamBlock,
  type LedgerCommand,
} from "../src/lib/spatialLedger";
import { openEcosystemRepository } from "../server/unified-ecosystem.mjs";
import {
  createSpatialLedgerService,
  requireSpatialExecution,
} from "../server/spatial-ledger.mjs";
function fixture() {
  let state = ledgerSeed();
  return {
    get state() {
      return state;
    },
    act(
      role: string,
      action: LedgerCommand["action"],
      fields: Partial<LedgerCommand> = {},
      id = `actor-${role}`,
    ) {
      state = applyLedger(
        state,
        { id, role, exhibitionId: "sandbox" },
        {
          expected: state.version,
          targetId: state.artworks[0].id,
          ...fields,
          action,
        },
        "theme-approved",
      );
    },
  };
}
test("Committee approval requires authorized block, active gallery and both capacity limits", () => {
  const f = fixture();
  assert.throws(
    () => f.act("Committee", "APPROVE", { galleryId: "gallery-a" }),
    /authorize/,
  );
  f.act("Director", "AUTHORIZE_BLOCK");
  assert.throws(() => f.act("Committee", "APPROVE"), /active gallery/);
  f.act("Committee", "APPROVE", { galleryId: "gallery-a" });
  f.act("Committee", "APPROVE", {
    targetId: f.state.artworks[1].id,
    galleryId: "gallery-a",
  });
  assert.deepEqual(capacity(f.state, "gallery-a"), { works: 0, m2: 10 });
  assert.throws(
    () =>
      f.act("Committee", "APPROVE", {
        targetId: f.state.artworks[2].id,
        galleryId: "gallery-a",
      }),
    /capacity/,
  );
  const limited = ledgerSeed();
  limited.block.state = "ACTIVE";
  limited.galleries[0].usableM2 = 5;
  assert.throws(
    () =>
      applyLedger(
        limited,
        { id: "c", role: "Committee", exhibitionId: "sandbox" },
        {
          action: "APPROVE",
          expected: 0,
          targetId: limited.artworks[0].id,
          galleryId: "gallery-a",
        },
        "theme",
      ),
    /capacity/,
  );
});
test("closure orphans only affected approvals, preserves money, and reassignment needs fresh clearances", () => {
  const f = fixture();
  f.act("Director", "AUTHORIZE_BLOCK");
  f.act("Committee", "APPROVE", { galleryId: "gallery-a" });
  f.act("General_Exhibition_Coordinator", "DELEGATE", {
    coordinatorId: "coordinator-a",
  });
  f.act("Technical", "TECHNICAL");
  f.act(
    "Exhibition_Coordinator",
    "DRAFT_CONTRACT",
    { amountMinor: 100000 },
    "coordinator-a",
  );
  f.act("General_Exhibition_Coordinator", "AUTHORIZE_CONTRACT");
  assert.doesNotThrow(() =>
    requireSpatialExecution(
      { spatialLedger: f.state },
      f.state.artworks[0].id,
      100000,
    ),
  );
  assert.throws(
    () =>
      requireSpatialExecution(
        { spatialLedger: f.state },
        f.state.artworks[0].id,
        99999,
      ),
    /agreement value/,
  );
  f.act("Finance", "RELEASE");
  assert.equal(f.state.artworks[0].paidMinor, 30000);
  const old = structuredClone(f.state);
  f.act("Director", "CLOSE_VENUE", {
    targetId: "museum",
    reason: "Sample budget reduction",
  });
  assert.equal(f.state.artworks[0].state, "LOCATION_ORPHANED");
  assert.throws(
    () =>
      requireSpatialExecution(
        { spatialLedger: f.state },
        f.state.artworks[0].id,
        100000,
      ),
    /valid approved gallery/,
  );
  assert.equal(f.state.artworks[0].paidMinor, 30000);
  assert.equal(f.state.artworks[1].state, "UNASSIGNED");
  assert.equal(old.artworks[0].state, "APPROVED");
  assert.throws(() => f.act("Finance", "RELEASE"), /valid approved/);
  assert.throws(
    () =>
      f.act(
        "Exhibition_Coordinator",
        "DRAFT_CONTRACT",
        { amountMinor: 100000 },
        "coordinator-a",
      ),
    /valid approved/,
  );
  assert.deepEqual(
    alternatives(f.state, f.state.artworks[0]).map((g) => g.id),
    ["square-a"],
  );
  f.act("General_Exhibition_Coordinator", "REASSIGN", {
    galleryId: "square-a",
    reason: "Use available courtyard",
  });
  assert.match(downstreamBlock(f.state, f.state.artworks[0]), /Technical/);
  assert.equal(f.state.artworks[0].authorizedVersion, null);
  f.act("Technical", "TECHNICAL");
  f.act("General_Exhibition_Coordinator", "AUTHORIZE_CONTRACT");
  assert.throws(() => f.act("Finance", "RELEASE"), /already/);
});
test("roles, edition scope, stale commands, draft ownership and budgets are enforced", () => {
  const f = fixture();
  assert.throws(() => f.act("Finance", "AUTHORIZE_BLOCK"), /another role/);
  assert.throws(
    () =>
      applyLedger(
        f.state,
        { id: "d", role: "Director", exhibitionId: "sandbox" },
        { expected: 0, action: "AUTHORIZE_BLOCK" },
        null,
      ),
    /theme approval/,
  );
  f.act("Director", "AUTHORIZE_BLOCK");
  assert.throws(
    () =>
      applyLedger(
        f.state,
        { id: "d", role: "Director", exhibitionId: "other" },
        {
          expected: 1,
          action: "CLOSE_SPACE",
          targetId: "gallery-a",
          reason: "Cut",
        },
        "theme",
      ),
    /outside/,
  );
  assert.throws(
    () =>
      applyLedger(
        f.state,
        { id: "c", role: "Committee", exhibitionId: "sandbox" },
        { expected: 0, action: "APPROVE" },
        "theme",
      ),
    /changed/,
  );
  f.act("Committee", "APPROVE", { galleryId: "gallery-a" });
  f.act("Technical", "TECHNICAL");
  f.act("General_Exhibition_Coordinator", "DELEGATE", {
    coordinatorId: "coordinator-a",
  });
  assert.throws(
    () =>
      f.act(
        "Exhibition_Coordinator",
        "DRAFT_CONTRACT",
        { amountMinor: 1000 },
        "coordinator-b",
      ),
    /another coordinator/,
  );
  assert.throws(
    () =>
      f.act(
        "Exhibition_Coordinator",
        "DRAFT_CONTRACT",
        { amountMinor: 15000001 },
        "coordinator-a",
      ),
    /budget/,
  );
  f.act(
    "Exhibition_Coordinator",
    "DRAFT_CONTRACT",
    { amountMinor: 1000 },
    "coordinator-a",
  );
  assert.throws(() => f.act("Finance", "RELEASE"), /authorization/);
  f.act("General_Exhibition_Coordinator", "WITHDRAW", {
    reason: "Artist declines alternative venue",
  });
  assert.equal(capacity(f.state, "gallery-a")?.works, 2);
  assert.equal(f.state.artworks[0].contractMinor, 1000);
});
test("local service serializes competing approvals, persists changes and rejects bypasses", async () => {
  const dir = await mkdtemp(join(tmpdir(), "sadu-spatial-"));
  try {
    const repo = await openEcosystemRepository(join(dir, "state.json"));
    const service = createSpatialLedgerService(repo);
    const actor = (role: string) => ({
      id: role,
      role,
      exhibitionId: "sandbox",
    });
    await assert.rejects(
      service.mutate(actor("Director"), {
        action: "AUTHORIZE_BLOCK",
        expected: 0,
      }),
      /theme approval/,
    );
    const proposals = [1, 2, 3].map((i) => ({
      en: `Theme ${i}`,
      ar: "موضوع",
      rationale: "Practice",
      feasibility: "Existing galleries",
      translation: "Reviewed",
    }));
    await service.theme(actor("Committee"), {
      action: "SUBMIT_PROPOSAL",
      expected: 0,
      proposals,
    });
    await service.theme(actor("Editorial"), {
      action: "PREFLIGHT",
      expected: 1,
      preflight: "Both languages reviewed",
    });
    await service.theme(actor("Director"), { action: "ENDORSE", expected: 2 });
    await service.theme(actor("Chairman"), {
      action: "SELECT",
      expected: 3,
      selected: 0,
    });
    await service.mutate(actor("Director"), {
      action: "AUTHORIZE_BLOCK",
      expected: 0,
    });
    const results = await Promise.allSettled([
      service.mutate(actor("Committee"), {
        action: "APPROVE",
        expected: 1,
        targetId: "case-mounir-fatmi",
        galleryId: "gallery-a",
      }),
      service.mutate(actor("Committee"), {
        action: "APPROVE",
        expected: 1,
        targetId: "case-murat-kurt",
        galleryId: "gallery-a",
      }),
    ]);
    assert.equal(results.filter((x) => x.status === "fulfilled").length, 1);
    assert.throws(
      () => requireSpatialExecution(repo.read(), "case-mounir-fatmi", 1000),
      /Technical/,
    );
    const restarted = await openEcosystemRepository(join(dir, "state.json"));
    assert.equal(restarted.read().spatialLedger.artworks[0].state, "APPROVED");
    assert.throws(() => service.read(actor("Artist")), /cannot access/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
