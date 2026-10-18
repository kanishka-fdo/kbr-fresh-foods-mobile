# KBR Fresh Foods mobile

Standalone Expo / React Native application for the existing KBR Fresh Foods API. This folder is separate from the web project. It contains native screens, not a wrapped copy of the website. The existing backend and database stay shared; no backend or frontend source files were changed.

The initial native implementation covers customer, wholesale, driver, staff and admin workflows. Full production parity is **not yet verified**. See [MIGRATION.md](./MIGRATION.md) for the route inventory, known differences and device acceptance checklist.

## Run locally

Use Node.js supported by the installed Expo SDK (currently SDK 57).

~~~powershell
git clone https://github.com/kanishka-fdo/kbr-fresh-foods-mobile.git
cd kbr-fresh-foods-mobile
npm ci
Copy-Item .env.example .env
~~~

Edit .env:

~~~dotenv
EXPO_PUBLIC_API_URL=https://kbr-fresh-foods-api-akdmaugpgae8hsad.southeastasia-01.azurewebsites.net/api
~~~

The default configuration now connects directly to the same hosted API as the website. You do not need to start a local backend or keep your computer running for database access. The phone still needs internet access. To intentionally use a separate local test server, replace this value with its LAN address; localhost on a phone points to the phone itself.

~~~powershell
npm start -- --clear
~~~

Open the QR code with an Expo Go version compatible with this SDK, or use a development build. The app does not invent sample data if the API is missing: it reports configuration/network errors and provides retries. Existing accounts and seeded demo accounts work against the same database.

## Validate

~~~powershell
npm run typecheck
npm run lint
npm test
npx expo export --platform all
npx expo-doctor
~~~

Tests cover account role access, guest cart merging, stock/quantity checks, authorization headers, API error handling and request timeouts. Bundling validates JavaScript compatibility; it does not produce an installed APK or prove device behavior.

## Development and release builds

EAS profiles are included for development, internal preview APKs and production store builds. Configure the app under your Expo account first:

~~~powershell
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest build --platform android --profile development
npx eas-cli@latest build --platform android --profile preview
npx eas-cli@latest build --platform ios --profile development
~~~

EAS cloud builds support working from Windows. iOS device testing and distribution require the appropriate Apple signing setup. No EAS project, credentials, cloud build or store submission has been created automatically.

Development, preview and production EAS profiles now explicitly use the verified hosted EXPO_PUBLIC_API_URL. EXPO_PUBLIC_ values are embedded in the app; never put server secrets in them. For Google Maps in your own Android binary, set EXPO_PUBLIC_ANDROID_MAPS_API_KEY and restrict the key to the application package and signing certificate. iOS uses Apple Maps by default.

Custom scheme routes include kbrfreshfoods://verify-email/TOKEN and kbrfreshfoods://reset-password/TOKEN. Existing email links still point to the web CLIENT_URL. Verified HTTPS Android App Links / iOS Universal Links and their hosting association files remain a deployment task. Custom schemes should be tested in a development build, not assumed to behave identically in Expo Go.

## Architecture

- src/app: Expo Router routes and tabs.
- src/context: secure session state and per-account persisted cart/wishlist.
- src/lib/services.js: adapted copy of the existing API service contract; no imports from the web project.
- src/lib/http.mjs: timeout-aware HTTP client with bearer tokens and safe session expiry.
- src/screens: native screens for shopping, auth, orders, profile, public pages and management.
- src/components: native UI, access guards and platform-specific map display.
- tests: focused Node tests for domain and network behavior.

Auth tokens use SecureStore on mobile. Browser preview sessions use sessionStorage. Cart and wishlist use AsyncStorage and separate keys per account. Foreground order views poll while active; polling pauses when the app is in the background.

In-app notifications use the existing API. Phone push notifications need server registration/delivery support and are not implemented. The existing card verification/mock-payment flow is preserved without collecting raw card details; real card charging needs a gateway. Continuous background driver GPS is also outside the existing implementation.

## Hosted reference and appearance

The confirmed reference is https://kbr-fresh-foods-kanishka.vercel.app/. Original website imagery, marketing copy, typography and branding are bundled with the app. See [MIGRATION.md](./MIGRATION.md) for remaining parity checks. During the SDK 58 rollout this project deliberately uses SDK 57 for physical Expo Go compatibility. The default start command explicitly selects Expo Go; use npm run start:dev for a custom development client.

## Shared live database connection

The mobile app is configured to use the API embedded in the deployed website. Admin login, authenticated reads and a metadata-only product save/readback were verified using the mobile HTTP client. This verifies the API connection; complete workflow testing on physical phones remains pending. Sign in with the same account you use on the website. All successful edits now target the live website database through that API.

## Repository contents

Commit source, assets, tests, configuration, package-lock.json and .env.example. Local .env files, dependencies, Expo caches, generated native projects, builds, signing credentials and operational test reports are excluded by .gitignore. Keep your local .env when pulling updates; it is never uploaded.
