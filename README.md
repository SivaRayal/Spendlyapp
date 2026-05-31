# Spendly ( Kaatha Lo Raasko ) — Mobile (React Native / Expo)

A fully offline, on-device expense tracker built with **Expo + React Native** and an **iOS-style** UI. Same functionality as the web version: per-user data, monthly Excel sheets with built-in summaries, category breakdowns, and Top 5 spending.

Authentication uses **device biometrics (Face ID / Touch ID / fingerprint)** — no passwords. All data lives in app-private storage on the device.

# Design & Developer Details

- Author: Siva Rayal
- Email: kuruva.siva8055@gmail.com

## Highlights

- **iOS-like UI:** SF-style typography, large titles, soft cards, rounded corners, segmented controls, pill chips, color-coded category icons.
- **Excel as the data store:** every change reads and writes a real `.xlsx` file on the device (one sheet per month with embedded Summary / Category Breakdown / Top 5).
- **Biometric login:** Face ID / Touch ID / fingerprint via `expo-local-authentication`.
- **Tab navigation:** Home · Add · Reports · Profile.
- **Export / share** the entire workbook via the OS share sheet.

## Stack

| Layer       | Library                                                                        |
| ----------- | ------------------------------------------------------------------------------ |
| Runtime     | Expo SDK 51, React Native 0.74, React 18                                       |
| Navigation  | `@react-navigation/native` + bottom tabs + native stack                        |
| Storage     | `expo-file-system` (xlsx + users.json on disk)                                 |
| Spreadsheet | `xlsx` (SheetJS)                                                               |
| Auth        | `expo-local-authentication`                                                    |
| UI          | `@expo/vector-icons`, `expo-linear-gradient`, `react-native-safe-area-context` |
| Export      | `expo-sharing`                                                                 |

## Project layout

```
expense-calculator-mobile/
├── App.js
├── app.json
├── babel.config.js
├── package.json
└── src/
    ├── theme/                       iOS-like colors, typography, formatters
    ├── components/                  Card, StatCard, PrimaryButton, TextField, SegmentedControl, Chip, Screen
    ├── context/AuthContext.js       biometric auth + user session
    ├── db/
    │   ├── paths.js                 paths inside FileSystem.documentDirectory
    │   ├── userDb.js                read/write users.json
    │   └── excelDb.js               read/write per-user xlsx, build monthly sheets w/ summary
    ├── navigation/
    │   ├── AppNavigator.js          auth stack vs main tabs
    │   └── TabNavigator.js          bottom tabs
    └── screens/
        ├── LoginScreen.js           pick account + biometric prompt
        ├── RegisterScreen.js        create local account (no password)
        ├── DashboardScreen.js       hero gradient + month summary + recent + top categories
        ├── AddExpenseScreen.js      amount, type, mode, category chips, date
        ├── ReportsScreen.js         monthly/yearly with category & top-5 breakdowns
        └── ProfileScreen.js         edit info, export xlsx, sign out
```

## Setup

From the project root:

```bash
cd ..\expense-calculator-mobile
npm install
```

## Running locally

```bash
npx expo start
```

Then:

- **On your phone:** install [Expo Go](https://expo.dev/go) from the App Store / Play Store and scan the QR code.
- **iOS simulator:** press `i` (requires Xcode on macOS).
- **Android emulator:** press `a` (requires Android Studio).

> **Note on biometrics:** Face ID / fingerprint won't prompt in the iOS simulator or Android emulator unless you've enrolled a virtual biometric. If no biometric hardware is detected, the app falls back to a passwordless sign-in.

## Building a real installable app

Use [EAS Build](https://docs.expo.dev/eas/) — no Mac required for iOS builds.

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android       # produces an .apk / .aab
eas build --platform ios           # produces an .ipa (TestFlight ready)
eas build --platform all
```

The build runs in Expo's cloud and gives you a downloadable artifact you can install on any compatible device.

## Where the data lives

On the device, inside the app's sandbox:

```
<documentDirectory>/expense-calculator/
├── users.json
└── expenses_<userId>.xlsx
```

You can pull the file out via the **Profile → Export Excel file** action. The xlsx structure mirrors the web version: one sheet per `YYYY-MM`, each containing rows + Summary + Category Breakdown + Top 5 spending.

## Differences from the web version

- **No Express server** — all reads/writes are local file system operations on the device.
- **No password** — biometric unlocks the app; user identity is the device.
- **Multi-user is per-device** — selecting a user from the Login list still triggers the biometric prompt; biometric verifies the device owner, not the specific account.
- **Date input** uses a plain `YYYY-MM-DD` field for simplicity. Drop-in upgrades: `@react-native-community/datetimepicker` for a native picker.

## Customizing the look

Open `src/theme/index.js` — colors, radii, typography, and category icons/colors are centralized there.
