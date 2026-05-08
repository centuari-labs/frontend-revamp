---
title: "`SubmitProofDialog` is half-built — Submit button has no handler; dropzone has no size/count bounds"
labels: ["bug", "medium", "ux", "area:leaderboard", "dead-ui", "dos-prep"]
---

# Summary

`src/components/leaderboard/dialogs/submit-proof-dialog.tsx` renders a "Claim" → "Submit proof of mission" flow with a working dropzone (drag/drop, file list, remove-file UI) — but **the Submit button has no `onClick` handler**. Users drop files, click Submit, and nothing happens. No API call, no toast, no feedback.

Additionally, the `useDropzone` config sets no `maxSize` and no `maxFiles`. When (if) the upload is implemented later without revisiting these defaults, the form will accept arbitrarily large or numerous files — a small DoS / memory-exhaustion footgun.

# Why

```tsx
// src/components/leaderboard/dialogs/submit-proof-dialog.tsx
const { getRootProps, getInputProps, isDragActive } = useDropzone({
  onDrop,
  accept: {
    "image/png": [],
    "image/jpeg": [],
    "image/jpg": [],
  },
  multiple: true,
  // ↑ no maxSize, no maxFiles
});

// Later:
<Button type="button" variant={"primary"} className="flex-1" disabled={files.length === 0}>
  Submit
</Button>
// ↑ no onClick, no upload, no nothing
```

`grep -E "fetch|upload|submit|POST|FormData|axios" submit-proof-dialog.tsx` returns only `removeFile.onClick` — there is no upload code anywhere in the file or in any direct consumer.

**Concrete user flow today:**

1. User clicks "Claim" → dialog opens.
2. User drags a 50-MB image into the dropzone → file appears in the list (loaded into JS memory; no warning if it exceeds reasonable limits).
3. User clicks "Submit" → **nothing**. Button stays clicked but no network request, no UI state change, no error.
4. User confused; closes dialog. Believes the claim worked or that the system is broken.

**Future-proofing concern:** when a contributor implements the upload (likely a `fetch("/api/leaderboard/submit-proof", { method: "POST", body: formData })` call), they may not revisit the dropzone config. The implementation would then ship with **no enforced upload size limit**, accepting whatever the user dropped — potentially several gigabytes per request.

# Acceptance criteria

The team picks **one** path; both close this issue.

## Path A — Complete the implementation properly

- [ ] Add a `useSubmitProof` hook that POSTs `multipart/form-data` to a backend endpoint (coordinate with backend on the route — `/leaderboard/submit-proof` or similar — and the proxy allowlist update if needed).
- [ ] `useDropzone` config tightened:

  ```ts
  useDropzone({
    onDrop,
    accept: {
      "image/png": [],
      "image/jpeg": [],
      "image/jpg": [],
    },
    multiple: true,
    maxSize: 5 * 1024 * 1024,    // 5 MB per file — adjust to actual policy
    maxFiles: 5,                  // refuse drops beyond 5
    maxTotalSize: 20 * 1024 * 1024, // optional helper if available, else gate manually in onDrop
  });
  ```

- [ ] Surface dropzone rejections to the user — `useDropzone` exposes a `fileRejections` array; render reasons inline ("File too large", "Too many files", "Wrong type").
- [ ] On submit success: close the dialog, toast confirmation, refresh leaderboard data via `invalidateUserQueries`.
- [ ] On submit failure: show the backend error message via the existing `apiClient` AuthError pattern.
- [ ] Backend re-validates MIME by inspecting file magic bytes, not just by trusting the `Content-Type` header — coordinate.
- [ ] Vitest covering: file drop happy path, oversized rejection, wrong-MIME rejection, submit success, submit error.

## Path B — Disable / remove the UI until backend is ready

- [ ] If the leaderboard claim flow isn't going live in the current sprint, prevent users from reaching this state. Options (pick one):
  - Replace the "Claim" trigger button with a `disabled` button + tooltip "Claim coming soon".
  - Render the dialog with a static "This feature is in development — check back soon" message and remove the dropzone entirely.
  - Remove the component import from the page that mounts it; add a TODO link to this issue.
- [ ] Add a comment at the top of `submit-proof-dialog.tsx` explaining the half-built state and linking to the backend integration ticket.
- [ ] Path B is a temporary measure; the issue stays open until Path A is implemented.

## Universal AC (regardless of path)

- [ ] Manual test on staging: confirm the user cannot reach a state where they click a non-functional Submit button.
- [ ] If Path A is taken, also verify the backend correctly rejects files larger than its own enforced limit, even when the frontend's bound is bypassed (DevTools `formData.append` directly).

# Files to change

- `src/components/leaderboard/dialogs/submit-proof-dialog.tsx`
- (Path A) `src/hooks/use-submit-proof.ts` (new)
- (Path A) `src/lib/api.ts` — add `submitProof(files, token): Promise<...>` function (via `apiClient`, multipart support — extend `apiClient` if it doesn't yet handle `FormData`)
- Tests for the chosen path

# Out of scope

- Backend implementation of the claim endpoint — coordinate separately.
- Image-content moderation (NSFW filter, OCR for proof verification, etc.) — out of frontend scope.
- File-storage strategy (S3 vs blob storage) — backend's call.

# Estimated effort

- Path A: ~80 LOC + tests + backend coordination. ~3-4 hours.
- Path B: ~5 LOC. ~10 minutes.

# Dependencies

None hard. If Path A: depends on backend endpoint existing.

# References

- Audit: `docs/audits/2026-05-08-frontend-review/security.md` (deep-dive Round 12, M-NEW-17)
- File: `src/components/leaderboard/dialogs/submit-proof-dialog.tsx`
- Existing forward-looking note on file uploads: `docs/audits/2026-05-08-frontend-review/forward-looking-hardening.md` doesn't currently cover file uploads — consider adding a section if Path A is taken.
