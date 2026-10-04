# V2 launch-entry correction

The first candidate was never launched. Its 29 exact historical Git paths remain reconstructable byte for byte from the seven archived files and 22 unchanged current files; the explicit restoration map is in local-evidence-v2/validation-report.json. Original CI-FREEZE/STAGE manifests remain historical V1 documents. Original 21 UI paths and B10 certificates remain unchanged.

V2 calls the actual locked 1.62.1 private server selection/registry without browser creation, hashes the selected headless entry, and requires actual DEBUG=pw:browser launch lines/PIDs to bind to it. Chromium public executablePath() describes full Chrome installation, not the default headless shell. The native command records its exact logger environment override; external DEBUG/DEBUG_FILE overrides are rejected. No entry path is guessed from a revision/cache convention.

Local validation: 66/66 synthetic guard tests, typecheck exit 0, eight syntax checks exit 0, and collection-only 10 cases per engine. Actual registry/source inspection creates no Page/browser, both installed target entries are absent locally, and actual B14 native executions are zero. Earlier locked-reporter format validation remains explicitly synthetic and unchanged. Root must independently review V2 before new private CI.

The separate CI-FREEZE-v2 and CI-STAGE-FILES-v2 manifests bind current candidate bytes. Actual CI binds its own checkout HEAD/tree/source vectors; the historical first candidate Git identity is evidence, never an assumed tested CI HEAD.
