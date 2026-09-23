# ANIMEX — GitHub Pages

A plain, futuristic anime discovery web app using live AniList data.

## Features

- Tinder-style anime discovery
- Infinite/randomized discovery
- Save anime to your collection
- Search
- Full anime descriptions and metadata
- Upcoming episode schedule with countdowns
- Interactive schedule entries
- YouTube videos in a separate category, grouped by language when available
- Legal/official streaming and external links supplied by AniList
- Local browser collection using `localStorage`
- Background music (`Warm Circle`) with an on-screen music control
- Mobile-friendly layout
- PWA manifest

## Publish on GitHub Pages

1. Create a new GitHub repository.
2. Upload **all files and folders in this ZIP** to the repository root.
3. Open the repository's **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select the `main` branch and the `/ (root)` folder.
6. Save.
7. Wait for GitHub Pages to finish publishing.
8. Open the Pages URL on your Android phone.

### Important

Keep `index.html` in the repository root. Do not put the app inside an extra folder.

The app gets live anime information from the AniList GraphQL API, so the device needs an internet connection for discovery, search, details, and schedules.

The collection is stored locally in the browser on each device.

## Local testing

For the most reliable test, use GitHub Pages or another HTTPS web host. Opening `index.html` directly with `file://` can have browser restrictions.

## Project structure

```text
/
├── index.html
├── app.js
├── style.css
├── manifest.json
├── .nojekyll
└── README.md
```

If the music is embedded in `index.html`, no separate MP3 file is required for the music feature.
