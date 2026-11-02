# Private GitHub bug intake

Bug reports are stored in D1 for admin review before optional GitHub delivery. Reporter email, linked user ID and raw browser information remain in the admin record; these fields are not accepted by the issue formatter. The issue includes reproduction details, expected/actual behavior, a reduced page address and an opaque report reference for correlating the admin record.

New reports strip URL usernames/passwords, query strings and fragments on both client and server before storage. The formatter repeats that reduction to protect reports created by older code. Invalid or non-HTTP(S) page addresses are omitted. Historical database rows are not rewritten. Report titles are no longer sent with the analytics event; analytics receives only the fixed severity category.

Reproduction text, titles and URL path segments can still contain personal information typed by a reporter. Metadata reduction is not a general secret detector. The English/Indonesian form asks reporters to avoid credentials and sensitive personal information, and the exporter requires private GitHub intake.

## Destination enforcement

Every delivery first reads the exact configured repository through GitHub's metadata endpoint. Export proceeds only when metadata confirms that the matching repository is private, unarchived and has issues enabled. Invalid configuration, unavailable/malformed metadata, public visibility, a name mismatch or a redirect blocks the POST. There is no cached private-state decision and no public fallback. Metadata verification and issue creation share one 15-second deadline; requests do not automatically retry an uncertain submission.

A blocked or failed GitHub notification does not undo the saved D1 report. The existing admin bugs page remains the intake source of record. GitHub issue creation can still fail after verification; this step introduces no background retries or outbox. A repository owner could later make private issues public, so maintain the intake repository's private visibility. A metadata check cannot make visibility and issue creation one atomic operation.

## Preview configuration — November 2, 2026

Dedicated private [mihaamiharu/twe-bug-reports](https://github.com/mihaamiharu/twe-bug-reports) is separate from both the public app repository and private recovery vault. Its private visibility, enabled issues and personal owner were verified. The `bug`, `critical`, `high`, `medium` and `low` labels are provisioned.

The approved fine-grained token selects only this repository, with Issues read/write and required Metadata read. It expires **December 2, 2026**; rotate it before expiry. Its owner copy is read-back verified in this Mac's login Keychain under service `com.testingwithekki.github-intake.preview.20261102`. The temporary plaintext transfer file was removed. Only preview Worker secrets `GH_API_TOKEN`, `GH_OWNER` and `GH_REPO` were installed. No credential was copied to GitHub Actions, no work-account credential or GitHub CLI was used, and production configuration is unchanged.

Privacy source `a8b8ffd`, built from release-branch commit `aa3be31`, passed `cf:build:preview` and deployed as Worker version `24974f2e-bddc-478c-8409-78f8d8fa5a7f`. That privacy version was verified active before installing intake secrets. The resulting preview version is `4cddb0b4-dee4-4dca-9825-776cf322b1da` at 100%, confirmed through Wrangler deployment metadata.

## Verification

Thirty focused, fully mocked cases passed with 71 assertions: private destination delivery; blocked public/wrong/archived/disabled/malformed destinations; metadata HTTP/JSON/configuration failures; visibility changes between submissions; shared deadline/no redirects; notification failures without automatic retries; and metadata/URL minimization. The preview build passed. Exactly one approved anonymous synthetic report was then submitted through the app's actual HTTP server-function endpoint. Its D1 row retained only synthetic contact/browser context and a page URL without credentials, query or fragment. Exactly one private issue, [test issue #1](https://github.com/mihaamiharu/twe-bug-reports/issues/1), was authored by `mihaamiharu` with matching report reference and `bug` / `low` labels. Synthetic contact, raw browser and sensitive URL markers were absent from its body. The issue was closed and only the matching synthetic D1 report was removed; the rate-limit bucket was left to expire normally.

No AI or email call was made during this check. Authenticated reporter behavior, hosted notification-failure persistence and full unit/integration/browser release checks remain for the consolidated candidate run. AI access and budget must be resolved before configuring or calling that provider. Production configuration and cutover require their own approval.

References: [GitHub repository metadata](https://docs.github.com/en/rest/repos/repos#get-a-repository), [GitHub create-issue permissions](https://docs.github.com/en/rest/issues/issues#create-an-issue).

See [the setup and live-check evidence](reports/cloudflare-github-intake-20261102.json).
