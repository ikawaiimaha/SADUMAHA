# Visual installation manifest audit

Implemented: private artwork thumbnail paired with approved bilingual text, declared zone and shared immutable ID. The existing label footer carries the identical ID. Technical and Logistics can reach export controls; database authorization remains independent of the role selector.

Audit improvements: no shortened/collision-prone IDs; no inferred museum clearance; no blank thumbnail success; bounded sequential image downloads; original aspect ratio retained; abort on auth change/unmount; refresh approved evidence before export; source files and signed links are absent from the output.

Verification: 133 guard tests and production build; desktop/mobile browser PDF downloads and denied-image failure; visually rendered PDF page; local rollback SQL confirms Technical cannot see draft labels but can read submitted ones. No hosted migration executed.

Limits: PNG preview only (20 MiB, 100 artwork limit), TIFF/video conversion pending; no automatic creation of physical backing tags. This is an internal raster proof, not a museum-certified print master.
