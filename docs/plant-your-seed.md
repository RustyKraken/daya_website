# Plant your seed

Interactive page at `/plant-your-seed/`. The same URL works as the QR code destination next to the seed pots outside the restaurant.

## Files

| Path | What it is |
| --- | --- |
| `plant-your-seed/index.html` | Vite entry for the page (registered in `vite.config.js`) |
| `src/plant-main.jsx` | Mounts the page |
| `src/plant/PlantYourSeed.jsx` | Page, stage state machine and storytelling section |
| `src/plant/PlantScene.jsx` | SVG scene: seed, pot, watering can, sun, tree, all interactions and animation |
| `src/plant/tree.js` | Procedural pomegranate tree; every part has a start time on one growth scale |
| `src/plant/plant.css` | Styles |
| `src/App.jsx` | "Plant your seed" button in the header and a footer link. `SiteNav`, `MenuOverlay` and `DayaFooter` are exported for reuse |

## Stages

`seed → water → sun → grow → done`, driven by a reducer in `PlantYourSeed.jsx`. The scene reports each finished stage back with `onStageDone`. Every stage also has a button for touch, mouse and keyboard users. You can either tap "Plant the seed" or press and hold the hold buttons (Space or Enter).
