# Devpost submission draft

## Tagline

**The learning roadmap your syllabus never gave you.**

## Inspiration

A syllabus tells a student what is in a course, but often leaves them to figure out the learning order, the best resources, and what prerequisite to revisit when a topic becomes difficult. We wanted to turn that gap into a product.

## What it does

ConceptAtlas converts a student's syllabus into a step-by-step visual learning roadmap. Every roadmap topic can open a focused resource pack containing free resources, paid/structured options, practice, books, projects, videos, and additional references. When a learner is stuck, the app can diagnose the smallest plausible prerequisite gap and direct the learner to that missing piece.

## How the AI works

The syllabus is converted to Markdown with MarkItDown and then analyzed by Groq into a compact course model: concepts, difficulty, sequence, and prerequisite relationships. A lightweight recommendation heuristic combines current estimated understanding, dependency confidence, and downstream unlock value to rank prerequisites. Groq also powers the diagnostic, response evaluation, targeted lesson, retest, and live resource discovery.

For live resource discovery, ConceptAtlas uses Groq Compound Mini's built-in web search and keeps only resource URLs that were actually returned by the search tool.

## Why it is different

A generic tutor usually starts from the question: **“What topic do you want explained?”**

ConceptAtlas starts from the learner's course: **“Here is what I actually need to learn. What should I learn next, and what should I revisit when I'm stuck?”**

## How we built it

React + Vite + TypeScript for the UI, a lightweight SVG roadmap renderer, Python + MarkItDown for document conversion, Groq for AI reasoning/web resource discovery, server-side API handlers for secrets, Zod for response validation, and a small local Vite bridge for the complete development flow.

## Challenges

We had to keep prompts small enough for constrained Groq TPM limits while preserving the useful structure of long syllabi. We solved this by converting documents once, compressing repetitive prose before course analysis, and keeping the resulting course model compact.

## Accomplishments

- Turned arbitrary course documents into a visual learning sequence.
- Made each concept actionable with a resource pack rather than a generic search link.
- Added an intentionally small but memorable “Stuck?” diagnostic pathway.
- Kept the architecture local-first and low-dependency.

## What we learned

The strongest educational AI experience is not necessarily the one with the most features. It is the one that makes a learner's next action obvious.

## What's next

Future versions could learn from repeated learner behavior, support richer syllabus structures, compare alternate learning paths, and evaluate the quality of external resources over time.

## Built With

React, TypeScript, Vite, Python, MarkItDown, Groq API, Groq Compound, Zod, CSS.
