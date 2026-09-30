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
