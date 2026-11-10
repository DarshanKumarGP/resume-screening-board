# Resume screening board

A web app that helps a hiring team sort a pile of resumes between two open roles: LCA Consultant and UI/UX Intern. It reads each resume, classifies it, ranks everyone separately for each role, and shows the evidence behind every score so a reviewer can check the result instead of trusting a number.

A new resume can be uploaded at any time. It is scored with the same rules and placed in the existing ranking straight away.

## Features

- Extracts text from PDF, DOCX and TXT resumes.
- Pulls out experience (with years), education, skills, projects and links.
- Scores every resume from 0 to 100 against each job description.
- Classifies each resume as LCA, UI/UX, Both, or Neither / uncertain.
- Ranks resumes per role, with a score breakdown and the matching text for each part.
- Review screen with search, filters, sorting, a CSV download and a link to the original file.
- Unreadable or unusual files are listed with a plain explanation instead of being dropped.
- Upload test: score a single new resume and see where it would rank.

The scoring is rule-based, with no database and no external API, so the same resume always gets the same score. `METHODOLOGY.md` describes the approach and its limits.

## Tech

Next.js 15 (App Router), React 19, `unpdf` for PDF text and `mammoth` for Word files.

## Getting started

Requires Node.js 18.18 or newer.

```
npm install
npm run dev
```

Open http://localhost:3000.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the app in development mode |
| `npm run build` | Creates the production build |
| `npm start` | Serves the production build |
| `npm run ingest` | Reads every file in `public/resumes/` and writes `data/processed.json` |
| `npm run check` | Runs the self-tests |

## Changing the resume set or the scoring

The app reads `data/processed.json`, which is generated from the files in `public/resumes/`. After adding or removing resumes, or editing the scoring rules, run:

```
npm run ingest
```

Scoring rules, keyword weights and classification thresholds are in `lib/config.js`.

## Project structure

```
app/                  Page, layout, styles and the upload API route
  api/upload/         Scores a single uploaded resume
components/           Review screen and candidate details panel
data/
  jds/                The two job descriptions (plain text)
  processed.json      Generated results for the resume set
lib/
  config.js           Scoring rubric and thresholds
  extract.js          Text extraction for PDF, DOCX and TXT
  sections.js         Heading detection
  dates.js            Date ranges and years of experience
  analyze.js          Field extraction, scoring, classification, warnings
  rank.js             Ranking
public/resumes/       The resume files
scripts/              Batch processing and self-tests
```

## Deployment

The project deploys to Vercel with no configuration. `data/processed.json` and `public/resumes/` are part of the repository, so the deployed app does not need to process anything at build time.

On the free plan, uploads are limited to 4 MB. Uploaded resumes are scored but not stored.