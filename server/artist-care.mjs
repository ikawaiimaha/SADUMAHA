import {
  customsExport,
  consolidationCandidates,
} from "../src/lib/artistFreight.ts";
import { artistShippingPdf } from "../src/lib/artistShippingPdf.ts";
import {
  applyArtistCare,
  emptyArtistCare,
  prepareInvitations,
  projectArtistCare,
} from "../src/lib/artistCare.ts";

/** Local service port. Binary ingestion must supply a trusted, scoped media verifier. */
export function createArtistCareService(
  repository,
  {
    verifyMedia = async () => {
      throw Object.assign(
        new Error(
          "Verified media storage is not connected to this endpoint. Use the local browser demonstration.",
        ),
        { status: 503 },
      );
    },
  } = {},
) {
  const scope = (s, actor) => {
    if (
      !actor ||
      !s.spatialLedger ||
      s.spatialLedger.exhibitionId !== actor.exhibitionId ||
      ![
        "Artist",
        "Artist_Portal",
        "Director",
        "General_Exhibition_Coordinator",
        "Exhibition_Coordinator",
        "Committee",
        "Editorial",
        "Finance",
        "Technical",
        "Logistics",
        "Logistics_Officer",
      ].includes(actor.role)
    )
      throw Object.assign(new Error("Artist-care scope denied."), {
        status: 403,
      });
  };
  const bindArtists = (s, care) => {
    for (const i of care.invitations) {
      const a = s.artworks?.find((a) => a.id === i.artistId);
      if (a?.artistActorId) i.artistActorId = a.artistActorId;
    }
    return care;
  };
  return {
    read(actor) {
      const s = repository.read();
      scope(s, actor);
      return projectArtistCare(
        s.artistCare ?? emptyArtistCare(),
        actor,
        s.spatialLedger,
      );
    },
    exportToCustoms(actor, invitationId, workId) {
      if (
        ![
          "Artist",
          "Artist_Portal",
          "Logistics",
          "Logistics_Officer",
          "General_Exhibition_Coordinator",
          "Director",
        ].includes(actor?.role)
      )
        throw Object.assign(
          new Error(
            "Customs export belongs to the artist and authorized shipment desks.",
          ),
          { status: 403 },
        );
      const state = this.read(actor),
        invitation = state.invitations.find((i) => i.id === invitationId),
        work = invitation?.works.find((w) => w.id === workId);
      if (!work)
        throw Object.assign(new Error("Artwork unavailable in this scope."), {
          status: 404,
        });
      return customsExport(invitation, work);
    },
    async shippingLabel(actor, invitationId, workId) {
      this.exportToCustoms(actor, invitationId, workId);
      const ledger = repository.read().spatialLedger;
      const invitation = this.read(actor).invitations.find(
        (i) => i.id === invitationId,
      );
      if (
        ledger.curation?.phase !== "ENDORSED" ||
        ledger.curation.snapshots.at(-1)?.id !== invitation.rosterId ||
        !ledger.artworks.some(
          (a) => a.id === invitation.artistId && a.state === "APPROVED",
        )
      )
        throw Object.assign(
          new Error(
            "An active allocation and current endorsed roster are required.",
          ),
          { status: 409 },
        );
      const state = this.read(actor),
        work = state.invitations
          .find((i) => i.id === invitationId)
          .works.find((w) => w.id === workId);
      return Buffer.from(await artistShippingPdf(work));
    },
    consolidation(actor) {
      if (
        ![
          "Logistics",
          "Logistics_Officer",
          "General_Exhibition_Coordinator",
        ].includes(actor?.role)
      )
        throw Object.assign(new Error("Freight planning access denied."), {
          status: 403,
        });
      return consolidationCandidates(this.read(actor));
    },
    mutate(actor, command) {
      return repository.transaction(async (s) => {
        scope(s, actor);
        const check = async (value) => {
          if (!value || typeof value !== "object") return;
          if (
            typeof value.hash === "string" &&
            typeof value.id === "string" &&
            "bytes" in value
          )
            await verifyMedia(actor, value);
          else for (const v of Object.values(value)) await check(v);
        };
        await check(command.data);
        const result = await applyArtistCare(
          s.artistCare ?? emptyArtistCare(),
          actor,
          command,
          s.spatialLedger,
          undefined,
          s.themeWorkflow,
        );
        s.artistCare = bindArtists(s, result.state);
        return {
          state: projectArtistCare(s.artistCare, actor, s.spatialLedger),
          ...(result.token ? { token: result.token } : {}),
        };
      });
    },
    prepare() {
      return repository.transaction(async (s) => {
        if (s.spatialLedger && s.artistCare)
          s.artistCare = bindArtists(
            s,
            await prepareInvitations(s.artistCare, s.spatialLedger),
          );
      });
    },
  };
}
