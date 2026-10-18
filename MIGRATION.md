# Migration inventory and acceptance

Status: native implementation connected to the hosted API; complete workflow and real-device acceptance remain pending. "Implemented" below means the route and API integration exist; it does not mean the workflow has passed on a physical phone.

## Validation on 2026-10-18

- TypeScript typecheck: passed.
- Expo ESLint: passed with no warnings.
- Node domain/network tests: 8 passed.
- Expo Doctor: 20/20 checks passed.
- Metro export: Android, iOS and web bundles generated successfully.
- Original web project: no tracked-file changes; existing untracked image-inventory.txt and showcase/ preserved.
- Dependency audit: 28 advisories (20 high, 8 moderate). Several suggested fixes downgrade Expo/React Native to incompatible major versions. No forced downgrade was applied. Advisory triage remains a release blocker; successful compilation is not a security sign-off.
- No APK/IPA was built or installed; no live-backend or physical-device acceptance was performed.

## Existing route coverage

| Existing web routes | Mobile destination | Implementation |
|---|---|---|
| /, /shop, /products | Home and Shop tabs | Catalog search, categories, paging and role workspace; source-matched hero, typography, original assets and native marketing sections |
| /products/:id | /products/[id] | Details, prices, stock, wishlist and add-to-cart |
| /cart | Cart tab | Per-account persistence, guest merge, quantity changes and removal |
| /wishlist | /wishlist | Per-account saved products |
| /checkout | /checkout | Address selection, payment method, existing OTP API, stock/price recheck |
| /orders | /orders | Customer order list and filtering |
| /orders/:id, /track/:orderId | /orders/[id] | Status history, destination map, driver phone, QR, cancellation and server PDF invoice |
| /login, /register, /forgot-password | Same paths | Existing auth endpoints, customer/wholesale registration, resend verification |
| /verify-email/:token, /reset-password/:token | Equivalent token paths | Explicit verification/reset action; custom scheme configured |
| /profile | /profile | Profile, URL avatar, addresses, email OTP and password changes |
| /notifications | /notifications | Read/unread filter, mark read and mark all |
| /stores | /stores | Stores, locations, directions, hours, phone and store stock |
| /about, /contact | Same paths | Source-derived About history/team/regions and native contact form |
| /wholesale | /wholesale | Bulk catalog, minimum quantities and quote submission |
| /wholesale/orders | /wholesale-orders and /wholesale/orders/[id] | Quote history, details, cancellation and PDF summary |
| /driver | /deliveries and /scan/[id] | Assigned orders, status progression and camera QR confirmation |
| /staff | /staff-orders | Status filters, processing, driver assignment, payment changes |
| /staff/inventory | /inventory and /categories | Product/category forms, paging, stock/expiry filters and exports |
| /staff/wholesale | /staff-wholesale | Approve, reject, fulfil and record transactions |
| /admin | /dashboard | Summary and report data views |
| /admin/users | /users | List/filter, create staff/driver/admin/wholesale, edit details, roles, account access, buyer approvals and export |
| /admin/suppliers | /suppliers | Supplier management and export |
| /admin/purchases | /purchases | Purchase history, payment amounts and export (existing web screen is a history view) |
| /admin/inventory-intel | /inventory-intelligence | Health, freshness, pricing, forecast, allocation, warehouse, supplier performance and reorder data |
| /admin/reports | /reports | Sales, products, categories, customers, forecasts and export |
| /admin/shop | Shop tab | Admin can preview the same public catalog |

Deep links to legacy web paths are not automatically remapped.

## Implemented foundation

- Expo SDK 57, React Native, TypeScript and Expo Router.
- Standalone dependency lockfile; no runtime imports from the website.
- Secure token storage and authenticated API requests.
- Per-account cart/wishlist persistence and role guards; backend remains responsible for authorization.
- Native camera QR scanning, map markers/directions and PDF/CSV sharing.
- Error/retry states, request timeout and foreground polling.
- EAS development, preview and production build profiles.

## Remaining acceptance and differences

- [x] Configure the hosted website API and verify public reads, admin authentication, admin reads and a metadata-only save/readback using the mobile HTTP client.
- [ ] Confirm API health and complete interactions from a physical phone.
- [ ] Run every role's workflow against test accounts and a disposable test database.
- [ ] Customer: registration -> email verification -> login -> cart -> checkout -> order -> delivery QR.
- [ ] Staff/driver: processing -> packing -> driver assignment -> out for delivery -> QR confirmation.
- [ ] Wholesale: quote -> approval/rejection -> payment recording -> fulfilment/cancellation.
- [ ] Admin: user/role changes, buyer approval, inventory, suppliers, purchases and all reports.
- [ ] Account isolation after logout/account switching and failed persistence.
- [ ] QR camera permission denial, invalid codes, retry and cancellation on real devices.
- [ ] Google Maps key restrictions and rendering in a signed Android build.
- [ ] Invoice download, PDF printing/sharing and CSV opening on Android and iOS.
- [ ] Connection loss, request timeout and app background/resume during each mutation.
- [ ] Native device styling, small screens, large accessibility fonts and keyboard behavior.
- [x] Package the original logo as the app icon and restore original branding/product imagery.
- [x] Restore source homepage/About copy, images, fonts and native marketing sections.
- [ ] Verify remaining visual parity and richer analytics charts; current reports expose data as readable native cards.
- [ ] Add native image-library avatar selection; current implementation accepts an image URL.
- [ ] Add location picking/current-location assistance; addresses currently accept coordinates.
- [ ] Verify original quantity/cart edge cases and browser invoice/report layout parity.
- [ ] Add verified HTTPS app links and host domain association files without changing the existing web project.
- [ ] Review dependency audit results and resolve release-blocking advisories with SDK-compatible versions.
- [ ] Create signed internal Android/iOS builds and complete real-device acceptance.
- [ ] Store assets, privacy disclosures and submission.

Push notifications, a real card gateway and continuous background GPS are additional integrations. Current notifications are in-app, payments follow the existing backend status/OTP flow, and delivery maps show destinations.

## Correction on 2026-10-19

Expo Go compatibility targets SDK 57. Homepage/About source copy, images, fonts and branding were restored. The user’s .env was preserved. Management/report visual parity and physical-phone acceptance remain pending. The previously listed validation/audit results are historical. SDK 57 typecheck, lint and eight tests passed; Expo Doctor passed 21/21 checks and Android, iOS and web bundles exported. The 20 bundled source images matched their originals by SHA-256. Dependency advisories require review before release.

## Shared hosted API — 2026-10-19

The mobile .env and all EAS build profiles now use the exact API URL confirmed from the deployed website bundle. Public catalog reads, admin login/session, dashboard/users/orders/wholesale/suppliers/purchases reads and a metadata-only product save/public readback passed using the mobile HTTP client. No business product values were changed. Physical-phone interaction and complete feature/visual parity remain separate acceptance tasks.
