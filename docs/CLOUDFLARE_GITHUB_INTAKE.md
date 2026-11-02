# Private GitHub bug intake

Bug reports are stored in D1 for admin review before optional GitHub delivery. Reporter email, linked user ID and raw browser information remain in the admin record; these fields are not accepted by the issue formatter. The issue includes reproduction details, expected/actual behavior, a reduced page address and an opaque report reference for correlating the admin record.

New reports strip URL usernames/passwords, query strings and fragments on both client and server before storage. The formatter repeats that reduction to protect reports created by older code. Invalid or non-HTTP(S) page addresses are omitted. Historical database rows are not rewritten. Report titles are no longer sent with the analytics event; analytics receives only the fixed severity category.

Reproduction text, titles and URL path segments can still contain personal information typed by a reporter. Metadata reduction is not a general secret detector. The English/Indonesian form asks reporters to avoid credentials and sensitive personal information, and the exporter requires private GitHub intake.

## Destination enforcement

Every delivery first reads the exact configured repository through GitHub's metadata endpoint. Export proceeds only when metadata confirms that the matching repository is private, unarchived and has issues enabled. Invalid configuration, unavailable/malformed metadata, public visibility, a name mismatch or a redirect blocks the POST. There is no cached private-state decision and no public fallback. Metadata verification and issue creation share one 15-second deadline; requests do not automatically retry an uncertain submission.

A blocked or failed GitHub notification does not undo the saved D1 report. The existing admin bugs page remains the intake source of record. GitHub issue creation can still fail after verification; this step introduces no background retries or outbox. A repository owner could later make private issues public, so maintain the intake repository's private visibility. A metadata check cannot make visibility and issue creation one atomic operation.

## Configuration still required

Dedicated private [mihaamiharu/twe-bug-reports](https://github.com/mihaamiharu/twe-bug-reports) was created through the personal web session on November 2; its Private badge, personal author and Issues tab were verified. It is separate from both the public `twe` code repository and the private `twe-backups` recovery vault. Keep it private and provision the `bug` / severity labels used by the app when completing setup.

Create a fine-grained token for only that repository with Issues write permission and the accompanying repository metadata access. Save the owner copy securely and install preview-only `GH_API_TOKEN`, `GH_OWNER` and `GH_REPO` Worker secrets. Do not use a work-account credential, the backup export token or the GitHub CLI work login. Application runtime credentials do not need to be copied into the public repository's GitHub Actions secrets.

The privacy source is committed on the release branch as `a8b8ffd`; it has not been built/deployed to preview yet. The private destination is created, but token settings are blocked on GitHub's fresh Confirm access prompt. No intake token, remote secret or live issue has been created. Do not install intake runtime secrets until preview is running the privacy guard. The next integration gate is one explicitly approved, clearly labeled synthetic report submitted through the preview app. Its private issue must contain no real contact details, credentials or sensitive URL values. Confirm admin persistence and optional-delivery failure behavior in the consolidated release checks.

## Verification

Thirty focused, fully mocked cases passed with 71 assertions: private destination delivery; blocked public/wrong/archived/disabled/malformed destinations; metadata HTTP/JSON/configuration failures; visibility changes between submissions; shared deadline/no redirects; notification failures without automatic retries; and metadata/URL minimization. No live GitHub or AI call was made. Full unit/integration/build/browser release verification remains deferred to the consolidated candidate run.

References: [GitHub repository metadata](https://docs.github.com/en/rest/repos/repos#get-a-repository), [GitHub create-issue permissions](https://docs.github.com/en/rest/issues/issues#create-an-issue).

See [the source/setup evidence](reports/cloudflare-github-intake-20261102.json).
