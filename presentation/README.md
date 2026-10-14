# Phase 2 video kit: E-Scooter Smart Wheel Analyzer

Slides and a guide for recording the 5–8 minute video. They are separate from the analyzer itself, which is in the sibling folder `project`.

```
MariaAn/
├── project/          the analyzer (Phase 1 submission)
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   └── README.md
└── presentation/     this folder (Phase 2 video kit)
    ├── presentation.html   the slides (open this)
    ├── presentation.css
    ├── presentation.js
    ├── src-tools.js        reads the real code for the code slides
    ├── source-data.js      copy of ../project source (generated)
    ├── make-source-data.js regenerates source-data.js
    ├── video-guide.html    step-by-step guide to making the video
    └── guide.css
```

The `project` folder must stay next to this folder: the slides run the real analyzer from `../project/index.html` and show code from `../project/script.js`.

## How to use

1. Open `presentation.html` (double-click). Read `video-guide.html` first if you need the step-by-step instructions.
2. Press **→** / **←** to move between slides.
3. Press **S** (or the "Source code" button) to see the full source code at any time. Close it with **Esc**.
4. Click the orange words on the first and last slide and type your own name and contribution.

| Key | Action |
|---|---|
| → / Space, ← | next / previous slide |
| S, Esc | open / close the full source code |
| C | show or hide comments in the code snippets |
| N | speaker notes (hide before recording) |
| T, R | start or pause the timer, reset the timer |
| F | full screen |

## After you change the analyzer's code

The slides read a copy of the code saved in `source-data.js` (browsers block reading local files when a page is opened by double-click). Update it with:

```
cd presentation
node make-source-data.js
```

If the slides are served over http (for example VS Code "Live Server"), they read the live files and no update is needed.

## Reminder

The slides support your own explanation; they do not replace it. The task form says an AI-generated presentation without the student's own explanation is insufficient (PDF p.7, "Presentation requirements" item 8). Replace the sample challenge on slide 14 with your real one, and credit the AI assistance (slide 15).
