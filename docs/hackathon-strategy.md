# Hackathon strategy — final scope

## Product positioning

**ConceptAtlas is a Roadmap.sh-style learning map for a student's actual syllabus.** roadmap.sh itself describes its product as community-curated roadmaps, study plans, paths, and resources, with interactive nodes and learning resources. ConceptAtlas starts from the student's course document rather than a pre-authored developer roadmap.

## Four judging categories

| Category | What the judge should see |
|---|---|
| Educational Impact | A syllabus becomes a concrete learning path instead of a pile of course pages. The learner can choose a topic, get a resource pack, and get help when stuck. |
| Creative AI/ML | Groq converts unstructured course material into an ordered concept model, discovers learning resources, and powers the stuck/diagnosis loop. |
| Technical Execution | MarkItDown ingestion, compact prompts, strict JSON validation, server-side Groq key, local API bridge, deterministic demo, responsive UI, graceful failures. |
| Pitch & Demo | One visual transformation: upload syllabus → roadmap → click topic → resource pack → stuck → prerequisite recommendation. |

## What we are deliberately not building

No authentication, database, vector DB, RAG pipeline, social feed, voice assistant, gamification layer, or giant analytics dashboard. Those would add risk without making the central story easier to understand.

## Core mechanism

1. Convert the syllabus with MarkItDown.
2. Compress it before the AI call so current Groq TPM limits are not wasted on repetitive prose.
3. Ask Groq for meaningful course concepts and a sensible sequence.
4. Render the sequence as the student's learning roadmap.
5. On a node, retrieve/curate a focused resource pack.
6. If the student is stuck, diagnose the smallest plausible prerequisite gap.

## Resource-pack design

Every concept can surface:

- free
- paid
- practice
- books
- project
- video
- other/reference

Live resource discovery uses `groq/compound-mini` web search. The backend filters the model's resource list against URLs actually returned by the search tool, reducing the risk of invented links.

## Demo mode

The demo course is deterministic: Machine Learning Fundamentals. The selected target is Backpropagation, and Chain Rule is the deliberately weak prerequisite. The demo story is designed to be repeatable on camera.


