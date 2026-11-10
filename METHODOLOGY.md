# Methodology

## What the prototype does

1. Reads each resume (PDF, DOCX or TXT) and extracts the text.
2. Splits the text into sections (experience, education, skills, projects) using the headings.
3. Pulls out dated roles, degrees, skills, projects and links.
4. Scores every resume from 0 to 100 against each job description using a fixed rubric.
5. Classifies the resume as LCA, UI/UX, Both, or Neither / uncertain.
6. Ranks resumes per role and shows the evidence behind each score.

Everything is rule-based. There is no language model call at run time, so the same resume always gets the same score and each point can be traced to a phrase in the resume.

## Extraction

- PDF text is read with `unpdf`; Word files with `mammoth`.
- Text is cleaned (ligatures, bullet characters, broken hyphenation) before analysis.
- Years of experience come from date ranges inside the experience section ("Jan 2020 - Mar 2022", "2019 - Present", "03/2021 - 05/2022"). Overlapping ranges are merged so parallel jobs are not counted twice. If there is no experience heading, dates are taken from the whole resume, skipping lines that look like education.
- "Relevant" experience only counts dated roles that mention the role's keywords or have a matching job title.
- Degrees are found by degree names and abbreviations (B.Tech, M.Sc, B.Des, MBA and so on).

## Scoring

LCA Consultant (100 points): LCA concepts and standards 30, LCA software 20, relevant experience 20, LCA projects 10, education 10, supporting skills 10.

UI/UX Intern (100 points): design tools 20, UX research and methods 25, visual and UI design 15, portfolio 10, design projects 10, design experience 10, education 5, sustainability interest 5.

Keyword groups use weighted terms with a target total, so a resume does not need every term to earn full marks. A term that appears only in a skills list counts for 70%, since it is not backed by any job or project. Experience and project groups scale up to a fixed amount (3 years and 3 projects for LCA, 6 months and 3 projects for UI/UX).

Two points about the job descriptions: the assignment text says 4 to 6 years for the LCA role, while the JD itself asks for 2 to 3 years. I followed the JD text. Also, the UI/UX role is open to 0 to 1 year, so extra experience is not penalised.

## Classification

- LCA or UI/UX: that score is at least 35 and ahead of the other by 12 or more.
- Both: both scores are at least 35.
- Neither / uncertain: both scores under 18, the scores are too close, or the file could not be read.

The thresholds are set in `lib/config.js`.

## Ranking

Candidates are sorted by score, then relevant years, then total years. Equal results share a rank. Uploaded resumes are scored with the same rules and placed among the existing ones.

## Error handling

Unreadable files (scanned images, corrupt files, old .doc files) still appear in the list with an error and a score of 0. Softer problems are shown as warnings: very little text, no recognised headings, no dates found, a stated experience that does not match the dated roles, no degree found.

## Results on the supplied resumes

Of the 47 resumes, 17 were classified as LCA, 24 as UI/UX, 1 as both and 5 as neither / uncertain. One file could not be read and five more were flagged with warnings. Each of these is listed in the app with the reason, and can be found by ticking "Only files with issues".

## Limits

- No OCR, so image-only resumes cannot be scored.
- Two-column or heavily designed PDFs can come out with scrambled line order, which affects sections and dates.
- Keyword matching does not understand context, so "no experience with GaBi" would still match GaBi. The evidence snippets in the app exist so a reviewer can spot this.
- The rubric weights are judgement calls. They are plain numbers in `lib/config.js` and are meant to be read and changed.

## Tools used

I used Claude, an AI assistant from Anthropic, to help plan the approach and write the first version of the code and this document. I then ran the project on the 47 supplied resumes, checked the results in the app, and reviewed the flagged files. The scoring itself is plain keyword weights and thresholds, with no AI model involved when a resume is scored.