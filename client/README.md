# Pavilion Court Resident Hub

Mobile-first React app for the Pavilion Court pilot estate.

## Run locally

```sh
npm install
npm run dev
```

## Stack

- React + Vite
- Tailwind CSS 4 through `@tailwindcss/vite`
- React Icons (`react-icons/fi`, Feather set)

## Source layout

```text
src/
  app/                   application shell and role navigation
  data/                  preview data and formatters
  features/
    resident/            resident pages and components
    admin/               estate admin pages and components
    committee/           committee pages and components
  shared/components/     cross-role UI and interaction patterns
  shared/pages/          reusable full-page creation forms
```

`src/App.jsx` is a small entry point; it delegates to `src/app/App.jsx`. The design and product reference documents are in the parent project folder.

All current data and role actions are local preview behavior. No accounts, backend services, email/OTP delivery, or payment provider are connected. Admin workflows in the preview include block/street management, resident household registration and removal, reset/promotion confirmations, self-registration requests, issue status reports, resident notices, editable campaign details, fixed estate household assessments with payment balances, committee election polls, and marketplace listing moderation. Estate assessments and voluntary fundraisers share one Giving area and campaign payment flow, while keeping their distinct amount and balance rules. Admins and committee members can open Resident space for marketplace, giving, issue reports, notices, and resident voting. Marketplace submissions require three to six images, show a selected-photo gallery, and remain hidden until admin approval. Admins can open a full detail page for each submitted item.

Admin overview includes a resident directory preview, with a full searchable directory and a dedicated Add resident page. Listing, issue, campaign, and resident creation use pages; dialogs are reserved for approvals, votes, and confirmations.
