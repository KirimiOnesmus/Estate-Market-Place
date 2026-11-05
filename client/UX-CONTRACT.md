# Resident Hub UI Contract

Domain rules remain in `../estate-marketplace-project.md`. This document describes the client structure and preview behavior only.

## Role ownership

- `src/app` owns app orchestration, role-aware page navigation, local preview state, and the shared dialog entry point.
- `src/features/resident` owns resident overview, marketplace, fundraiser, notice, and issue-report pages.
- `src/features/admin` owns estate operations, campaign management, resident verification, and estate issue review.
- `src/features/committee` owns committee overview, campaign votes, and decision history.
- `src/features/super-admin` owns platform operations, estate directory, platform account visibility, technical support, platform audit history, and settings.
- `src/shared/components` owns reusable shell, controls, dialogs, status, summary, and responsive data presentation; `src/shared/pages` owns repeated full-page create forms.
- `src/app/App.jsx` selects the signed-in user's role from `window.pavilionSession.user.role` and opens that role's home page. The header workspace switcher navigates the preview between `/resident`, `/admin`, `/committee`, and `/super-admin`; browser history can move between those workspaces. Unknown or missing roles fall back to the resident preview until sign-in is connected.
- The workspace switcher is a UI preview only. It does not grant permissions or secure role access; enforce roles on the server when authentication is connected.

## Admin resident management

- The admin overview shows a short verified resident list and an Add resident action.
- The Residents page contains the searchable verified directory and links to pending resident approvals.
- Add resident is a full-page form. Saving adds the resident to the local preview directory and returns to Residents with a success message.
- Approving a registration removes it from pending requests and adds the same resident details to the verified directory. Declining removes the request after confirmation.
- Resident approval and decline remain confirmation dialogs because they record access decisions.
- Estate admins can create and edit resident notices in full-page forms and delete them after a confirmation. Changes update resident notice views in the local preview.

## Create and decision flows

- Listing creation, issue reporting, and campaign drafting use full-page forms at the available content width. Cancel returns to the originating list; save returns to the relevant list and shows a success message.
- Dialogs are reserved for decisions or confirmations, including approving/declining residents, confirming campaign publication, committee approval, and rejection reasons.
- All create and decision actions remain local preview behavior until service APIs are connected.
- Marketplace listings accept M-Pesa and/or bank transfer only. Selecting a method reveals the seller payment-detail fields; item and cart views show matching instructions to residents. Payment instructions and orders are preview data; no transfer or mobile money transaction is initiated.
- The document title follows the current page title: `{Page} — Pavilion Court`.

## Preview data and actions

- Residents, listings, campaigns, notices, and report records are sample data.
- Listing creation, issue reporting, campaign drafting/publishing, resident decisions, and committee votes update local page state only. They are not sent to an estate service.
- Contributions and seller/admin contact are not connected.
- Marketplace search and filters run on local preview listings. Saved listing state lasts only for the current page session.
- Opening notices marks preview notices as read.
- Shared loading skeletons live in `src/shared/components/LoadingSkeleton.jsx`. Data-backed pages can show the matching dashboard, form, or list placeholder only while real data is pending; current sample data is synchronous, so the app does not add artificial loading delays. Estate logo image slots use the same skeleton primitive while the selected image decodes.
- Super Admin can add an optional estate logo (PNG, JPG, or WebP, up to 2 MB). The current estate branding appears in the signed-in application shell, household self-registration header, and `/login` preview and persists in this browser. Login UI is present, but authentication and password recovery are not connected.
- The Estate Admin overview derives household counts, pending registrations, open issue reports, committee campaign reviews, campaign funds raised, marketplace reviews, and published notices from the current preview records.
- The Appearance panel controls text size (Small, Standard, Large), page width (Standard, Wide), and color mode (Automatic, Light, Dark). Choices persist in local storage; defaults are Standard text size, Standard width, and Light mode.

## Super Admin scope

- Super Admin is the platform owner role. Its workspace provides estate create, edit, delete, billing status and access suspension; platform account create, edit, delete, role assignment, and access revocation; detailed support records with internal comments; read-only platform activity; and system settings.
- Super Admin has no resident approval, campaign approval, committee voting, notice publishing, or estate issue decision controls. Those decisions remain with the estate administrator and committee.
- Estate, account, support, audit, and settings changes are local preview state only. The role can manage multiple estate records in the interface; production tenant isolation, payment enforcement, audit persistence, and account invitations require backend services.

## Responsive reports

- At wide available container widths, report lists use semantic tables with headers.
- At narrower widths, report records become labeled stacked rows. Title and status remain visible; location and latest update are revealed inline.
- Row disclosure is keyboard-operable and exposes `aria-expanded` and `aria-controls`.

## Accessibility

- Buttons use native button semantics and icon-only controls have accessible names.
- Forms have associated labels, inline errors, and `noValidate` to avoid browser validation bubbles.
- Native modal dialogs provide focus management, background inertness, and Escape behavior.
- Controls have visible focus states and touch-friendly dimensions.
- The interface respects reduced-motion and forced-colors preferences.

## Deferred areas

- Resident sign-in and registration, account-holder fund release tools, and payment integration are outside this signed-in UI preview.
- Open business questions and later-phase decisions remain deferred in the project brief.
