# Turbo Rush

Turbo Rush is an arcade-style 3D kart racing game built with Three.js.

## Game features
- 9 selectable karts: Red Sports Car, Blue Sports Car, Black Sports Car, Formula X, Cyber Flash, Iron Guard, Rocket Fury, Banana Bolt and Sweet Ride.
- 8 selectable worlds: Tropical Paradise, Neon City, Snow Mountain, Desert Rush, Enchanted Forest, Volcano Island, Countryside and Amusement Park.
- Single-player mode with 7 AI rivals (8 racers total).
- Local two-player split-screen mode with 6 AI rivals (8 racers total).
- Three-lap races, race positions, finish order and results screen.
- Nitro boost (30 seconds) and Star power (timed visual effect).
- Keyboard and mobile touch controls, pause, responsive layout.
- Installable PWA shell with a service worker.
- Build workflows for an Android debug APK and Windows installer.

## Run in a browser
The quickest way is to open the GitHub Pages deployment once it is enabled, or run locally:

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. For the plain GitHub Pages version, use a local web server rather than opening the HTML file directly.

## Build Android APK
```bash
npm install
npm run build
npx cap add android
npx cap sync android
cd android
./gradlew assembleDebug
```
The debug APK is generated at `android/app/build/outputs/apk/debug/app-debug.apk`.

## Build Windows installer
```bash
npm install
npm run build
npm run desktop:dist
```
The Windows installer is written to `release/`.

## Automated builds
GitHub Actions runs the Android APK and Windows installer workflows on pushes to `main`. Open the repository's Actions tab and download the artifacts from a successful run.

## Development note
This is an actively developed game build. The automated packages are unsigned development builds, not store-ready releases. Test on actual devices before distributing widely.
