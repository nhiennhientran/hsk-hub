# Per-lesson recovery checkpoints

Exactly one sync owner stages and commits files. Authors and reviewers write only their own recovery directories and send their exact stage path, freeze path, freeze SHA256, and semantic qualification to the sync owner.

Each author freeze is saved immediately on `work/hsk-source-recovery-20261005`, starting at remote recovery commit `d3c4e2057e5c8cce5845186d202584a1b163e229`. A source transcription checkpoint is labelled author-only until a separate original-page reviewer has completed and frozen its report. A frozen independent report is synchronized separately; synchronization is not itself language acceptance or publication approval.

`prepare_checkpoint.py` reads only files, verifies all declared freeze hashes and exact byte counts, requires frozen external references to match immutable HEAD content, and prepares exact Git blob identities. It rejects paths outside the authorized new namespace and blocks direct uploads over 10,000,000 bytes. It changes no Git index, refs, commits, or network resources.

Before staging, verify an empty index and the expected local parent. Rehash every stage file, add only the exact owner paths, require the staged path set to match the capsule, and commit. Upload missing exact committed blobs using GitHub MCP. Create the tree on the last read-back remote tree, require its SHA to equal the local tree, commit with the actual remote parent, and update only the recovery branch with `force:false`. Read back the ref and commit/tree. Download each newly stored blob through the cloned remote commit and compare Git SHA, SHA256, mode, and byte count. Check `main` and `gh-pages` remain unchanged before declaring success.

Persist a small receipt with actual local/remote commit identities, tree SHA, stage/freeze identities, file verification results, and semantic qualification. Do not rebind a test result to a new Git commit merely because its tree is equivalent. A receipt can be sealed in the next checkpoint; the underlying lesson itself is already durable once remote read-back has succeeded.

For a large frozen file, preserve original bytes. Use exact verified parts in a separate fixed-branch helper whose CI creates only the original blob and never modifies refs or deploys. Do not recompress an old freeze to avoid a transport limit. When the exact old file cannot be recovered, create a clearly versioned new evidence snapshot with a fresh freeze and fresh checks instead of claiming byte identity.

Production authorization remains withheld. Do not merge to `main`, update `gh-pages`, publish a preview as production, or deploy.
