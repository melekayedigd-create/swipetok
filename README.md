# SwipePlay 🎮

A TikTok-style Android app for **games**: swipe up and a new game is ready to play.

- **15 built-in games made by AI** (each one is marked *🤖 Made by AI*). They are inside the APK, so they always work, even offline.
- **Create** your own games with Scratch-style blocks (stage, sprites, drag-and-drop scripts), then **publish** them so other people can play.
- **Online mode** (internet on): see games other players made, **like**, **save** and **comment** on them.
- **Offline mode** (no internet): you see the AI games, your saved games, your own games and the **last 20** community games you watched. When a 21st arrives, the **oldest one you saw is deleted**, so storage never grows past 20.
- Dark theme.

---

## 1. Create your free Firebase project (once, ~5 min)

Firebase is the online server where shared games, likes and comments are stored.

1. Go to <https://console.firebase.google.com> → **Add project** → name it `swipeplay` → you can turn Google Analytics off → **Create**.
2. **Build ▸ Authentication** → **Get started** → **Sign-in method** → **Anonymous** → **Enable** → **Save**.
3. **Build ▸ Firestore Database** → **Create database** → choose a location (e.g. `europe-west`) → **Start in production mode** → **Create**.
4. In Firestore open the **Rules** tab, delete everything, paste the content of [`firestore.rules`](firestore.rules) → **Publish**.
5. **Project settings** (⚙️ next to "Project overview") → **Your apps** → click the **`</>` Web** icon → name it `swipeplay-web` → **Register app**. You'll see a `firebaseConfig` with an `apiKey` and a `projectId`.
6. Open `app/src/main/assets/www/js/config.js` and paste them:

```js
window.SWIPEPLAY_FIREBASE = {
  apiKey: "AIzaSy...your key...",
  projectId: "swipeplay-1a2b3"
};
```

> Without this the app still works, but uses a **demo server** that lives only on one phone (the top pill says **Demo**).
> You can also paste the values later inside the app: **Profile ▸ Firebase settings ▸ Save & test**.

## 2. Build the APK with GitHub (no Android Studio needed)

1. Create a new **empty** repository on GitHub, e.g. `SwipePlay`.
2. Upload **everything in this folder** (keep the folders, including `.github/workflows/build-apk.yml`).
   Easiest: on the repo page, **Add file ▸ Upload files**, drag the whole folder content in, **Commit changes**.
   > If the `.github` folder doesn't upload (hidden folder), create the file manually: **Add file ▸ Create new file**, name it `.github/workflows/build-apk.yml` and paste the content.
3. Open the **Actions** tab → the **Build SwipePlay APK** run starts by itself (or click **Run workflow**). It takes about 3–5 minutes.
4. When it's green ✅, open the run → **Artifacts** → download **SwipePlay-APK** (a zip) → inside is `app-debug.apk`.
5. Send the APK to your phone, open it, allow **Install unknown apps** for your file manager/browser, and install.

Every time you change a file and commit, GitHub builds a new APK.

## 3. Using the app

| Tab | What it does |
|---|---|
| **Feed** | Swipe up/down between games. Tap the game to start. Right side: ❤ like, 💬 comments, 🔖 save (keeps it offline forever), ↻ restart. **New / Top** sorts community games (online only). |
| **Library** | AI games · Saved · Downloaded (x/20) · Mine. Tap a card to play full screen. |
| **Create** | *Starter game* (a ready catch game to learn from) or *Blank game*. Upload button = publish / update / unpublish. |
| **Profile** | Your name, connection status, Firebase settings, storage, sound. |

### The block editor
- **Top**: name, ✏️ game info (icon, description, variables), **▶ Test**.
- **Stage** (left): drag sprites to place them. **Sprites** (right): pick, add, rename, costume (emoji or shape), colour, size, shown/rotates, duplicate, delete, backdrop.
- **Categories**: Events, Motion, Looks, Sound, Control, Sensing, Operators, Variables.
- **Drag** a block from the palette to the scripts area. Drop it under another block to snap it, inside a C-block (*forever, repeat, if*), or drop a round/hexagon block into an input. Drag back to the palette (or the red bin) to delete.
- Coordinates: x from −180 to 180, y from −320 (bottom) to 320 (top). The variable **score** becomes the game's score.
- Useful blocks: *when ▶ game starts*, *when this sprite tapped*, *finger x / finger down?*, *create clone of myself / when I start as a clone*, *touching …?*, *game over: you win / you lose*.

## Project layout

```
app/src/main/assets/www/      ← the whole app (HTML/CSS/JS), works offline
  js/config.js                ← your Firebase keys
  js/aigames.js               ← the 15 AI games
  js/engine.js                ← blocks + interpreter
  js/editor.js                ← drag & drop editor
  js/backend.js               ← Firebase (REST) + demo server
  js/app.js                   ← feed, library, create, profile, offline/online
app/src/main/java/.../MainActivity.java   ← Android WebView wrapper (offline assets, back button, network changes)
.github/workflows/build-apk.yml           ← builds the APK on GitHub
firestore.rules                           ← Firebase security rules
```

Tip: you can also preview the app on your PC: open `app/src/main/assets/www/index.html` in Chrome (press F12 ▸ phone icon for a phone-size view).
