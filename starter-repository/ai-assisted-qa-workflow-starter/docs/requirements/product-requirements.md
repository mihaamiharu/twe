# Fictional PRD: QA Automation Workshop Scheduling

**Document owner:** Course team
**Status:** Practice specification
**Scope:** One public scheduling event page and the pre-booking flow

## Problem

Learners need to practice analyzing a scheduling experience without relying on a vendor's private product requirements. This fictional PRD defines the behavior they may test on the course-approved public event page.

## User story

As a learner who wants to attend a QA automation workshop, I want to choose an available slot and enter valid contact details so that I can review the booking information before deciding whether to submit it.

## In scope

- Opening the approved event page.
- Viewing available dates and times.
- Selecting one available slot.
- Entering synthetic name, email, and optional notes.
- Seeing validation feedback for required or invalid fields.
- Reviewing the pre-submission summary.

## Out of scope

- Final booking submission.
- Cancellation or rescheduling.
- Calendar integrations and notifications.
- Payment, authentication, or account recovery.
- Performance, load, security, or scraping testing.

## Ambiguities to investigate

- What counts as an available slot when the page updates while open?
- Is the timezone visible and understandable?
- What is the exact expected behavior for an optional note?
- Which validation message is shown for malformed email data?
- What happens when a selected slot becomes unavailable?

## Quality risks

- A learner may misunderstand the displayed timezone.
- A slot may become unavailable between selection and review.
- Validation may be visually present but inaccessible to assistive technology.
- A failure may originate from the target environment rather than the product.
