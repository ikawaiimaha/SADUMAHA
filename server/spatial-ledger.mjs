import { createArtistCareService } from "./artist-care.mjs";
import { prepareInvitations } from "../src/lib/artistCare.ts";
import { projectCuratorialLedger } from "../src/lib/curatorialAccess.ts";
import express from "express";
import {
  applyLedger,
  ledgerSeed,
  downstreamBlock,
} from "../src/lib/spatialLedger.ts";
import { applyTheme, emptyTheme } from "../src/lib/themeWorkflow.ts";

// Uses the existing serialized, durable local repository. No actor is accepted from a request body.
export function createSpatialLedgerService(repository) {
  const roles = [
    "Director",
    "Chairman",
    "Committee",
    "Editorial",
    "General_Exhibition_Coordinator",
    "Exhibition_Coordinator",
    "Technical",
    "Finance",
  ];
  function authorized(actor) {
    const records = repository.read().artworks ?? [];
    if (
      !actor ||
      !roles.includes(actor.role) ||
      (records.length &&
        !records.some((a) => a.exhibitionId === actor.exhibitionId))
    )
      throw Object.assign(
        new Error("This role cannot access venue planning."),
        { status: 403 },
      );
  }
  const initial = (s, actor) => {
    const ledger = ledgerSeed(actor.exhibitionId);
    if (s.artworks?.length)
      ledger.artworks = s.artworks.map((a, i) => ({
        ...ledger.artworks[i % ledger.artworks.length],
        id: a.id,
        name: "Fictional pilot artwork " + (i + 1),
      }));
    ledger.staff = [
      {
        id: "pilot-Exhibition_Coordinator",
        name: "Local pilot coordinator",
        languages: "Arabic / English",
      },
    ];
    return ledger;
  };
  return {
    care: createArtistCareService(repository),
    read(actor) {
      authorized(actor);
      const s = repository.read();
      const ledger = s.spatialLedger;
      if (ledger && ledger.exhibitionId !== actor.exhibitionId)
        throw Object.assign(new Error("Edition access denied."), {
          status: 403,
        });
      return {
        ledger: projectCuratorialLedger(
          ledger ?? initial(s, actor),
          actor.role,
        ),
        theme: s.themeWorkflow ?? emptyTheme(),
      };
    },
    theme(actor, command) {
      authorized(actor);
      return repository.transaction((s) => {
        if (
          s.spatialLedger &&
          s.spatialLedger.exhibitionId !== actor.exhibitionId
        )
          throw Object.assign(new Error("Edition access denied."), {
            status: 403,
          });
        s.spatialLedger ??= initial(s, actor);
        s.themeWorkflow = applyTheme(s.themeWorkflow ?? emptyTheme(), {
          ...command,
          role: actor.role,
          at: new Date().toISOString(),
        });
        return s.themeWorkflow;
      });
    },
    mutate(actor, command) {
      authorized(actor);
      return repository.transaction(async (s) => {
        const theme = s.themeWorkflow;
        const selected = theme?.events.findLastIndex(
          (e) => e.action === "SELECT",
        );
        const proof =
          theme?.selected !== undefined && selected >= 0
            ? `theme-selection-${selected + 1}`
            : null;
        s.spatialLedger = applyLedger(
          s.spatialLedger ?? initial(s, actor),
          actor,
          command,
          proof,
        );
        if (s.artistCare) {
          const previousCount = s.artistCare.invitations.length;
          s.artistCare = await prepareInvitations(
            s.artistCare,
            s.spatialLedger,
          );
          if (s.artistCare.invitations.length !== previousCount)
            s.artistCare.version++;
          for (const invitation of s.artistCare.invitations) {
            const artwork = s.artworks?.find(
              (a) => a.id === invitation.artistId,
            );
            if (artwork?.artistActorId)
              invitation.artistActorId = artwork.artistActorId;
          }
        }
        return projectCuratorialLedger(s.spatialLedger, actor.role);
      });
    },
  };
}
export function requireSpatialExecution(state, artworkId, amountMinor) {
  if (!state.spatialLedger) return; // Existing local journeys remain compatible until this module is initialized.
  const row = state.spatialLedger.artworks.find((a) => a.id === artworkId);
  if (!row)
    throw Object.assign(
      new Error(
        "Add this artwork to the spatial ledger before contracting or payment.",
      ),
      { status: 409 },
    );
  const blocked = downstreamBlock(state.spatialLedger, row);
  if (blocked) throw Object.assign(new Error(blocked), { status: 409 });
  if (
    row.authorizedVersion !== row.assignmentVersion ||
    !row.contractMinor ||
    row.contractMinor !== amountMinor
  )
    throw Object.assign(
      new Error(
        "Current Coordinator authorization must match the agreement value.",
      ),
      { status: 409 },
    );
}
export function spatialLedgerRouter(service) {
  const router = express.Router();
  router.get("/care", (req, res, next) => {
    try {
      res.json(service.care.read(res.locals.actor));
    } catch (e) {
      next(e);
    }
  });
  router.get("/care/consolidation", (req, res, next) => {
    try {
      res.json(service.care.consolidation(res.locals.actor));
    } catch (e) {
      next(e);
    }
  });
  router.get(
    "/care/:invitationId/:workId/export-to-customs",
    (req, res, next) => {
      try {
        res
          .set("Cache-Control", "private, no-store")
          .json(
            service.care.exportToCustoms(
              res.locals.actor,
              req.params.invitationId,
              req.params.workId,
            ),
          );
      } catch (e) {
        next(e);
      }
    },
  );
  router.get(
    "/care/:invitationId/:workId/shipping-label.pdf",
    async (req, res, next) => {
      try {
        res
          .set({
            "Cache-Control": "private, no-store",
            "Content-Disposition": "attachment; filename=SADU-crate-label.pdf",
          })
          .type("pdf")
          .send(
            await service.care.shippingLabel(
              res.locals.actor,
              req.params.invitationId,
              req.params.workId,
            ),
          );
      } catch (e) {
        next(e);
      }
    },
  );
  router.post("/care", async (req, res, next) => {
    try {
      res.json(await service.care.mutate(res.locals.actor, req.body));
    } catch (e) {
      next(e);
    }
  });
  router.get("/", (req, res, next) => {
    try {
      res.json(service.read(res.locals.actor));
    } catch (e) {
      next(e);
    }
  });
  router.post("/theme", async (req, res, next) => {
    try {
      res.json(await service.theme(res.locals.actor, req.body));
    } catch (e) {
      next(e);
    }
  });
  router.post("/command", async (req, res, next) => {
    try {
      res.json(await service.mutate(res.locals.actor, req.body));
    } catch (e) {
      next(e);
    }
  });
  return router;
}
