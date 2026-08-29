# ConceptAtlas

**The learning roadmap your syllabus never gave you.**

ConceptAtlas turns a real course syllabus into an interactive, step-by-step learning roadmap. Click any topic to get a focused resource pack—free, paid, practice, books, projects, and videos. When a learner is stuck, ConceptAtlas can diagnose the prerequisite worth revisiting instead of simply repeating the topic.

## The product in one picture

```text
Syllabus file
    ↓
MarkItDown
    ↓
Markdown
    ↓
Groq course analysis
    ↓
Step-by-step roadmap
    ├── topic → resource pack
    └── stuck → diagnostic → likely prerequisite → micro-lesson → retest
```

This deliberately avoids a vector database/RAG stack for the core syllabus transformation. The syllabus is converted once, analyzed into a compact course model, and the roadmap becomes the main product surface.

## Why it is different

roadmap.sh demonstrates the value of visual learning paths, interactive nodes, and resources. ConceptAtlas applies that interaction pattern to a student's **own syllabus**. The student does not start by searching the web; they start with the course they actually need to finish.

The signature action is **Stuck?**: ConceptAtlas uses the roadmap dependencies plus the learner's response to choose the smallest plausible prerequisite gap.

## Resource Pack

Each roadmap node can contain:

- Best free resource
- Best paid/structured resource
- Practice/labs
- Books
- Hands-on project
- Video explanation
- Additional reference

For demo topics, resources are curated and deterministic so a recorded demo is stable. For live uploaded syllabi, `/api/resources` uses Groq Compound Mini with web search; the app only keeps URLs that were actually returned by the search tool.

## Local setup

Prerequisites:

- Node.js 20+
- Python 3.10+
- A Groq API key for live analysis/diagnosis/resource discovery

### 1. Python environment

```bat
py -3 -m venv .venv
.venv\\Scripts\\activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

### 2. Node environment

```bat
npm install
```

### 3. Environment variables

Copy `.env.example` to `.env.local`:

```env
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-20b
```

The Groq secret is only used by server-side API handlers. Do not use a `VITE_` prefix and do not commit `.env.local`.

### 4. Start

```bat
npm run dev
```

The Vite development server includes a local `/api/*` bridge, including `/api/convert-file`, so the local experience exercises the same application routes rather than returning browser 404s.

You can also use `run-local.bat`.

## File ingestion

The upload path is:

```text
PDF/DOCX/PPTX/XLSX/CSV/TXT/MD/HTML
            ↓
        MarkItDown
            ↓
         Markdown
            ↓
      compact syllabus
            ↓
           Groq
```

Normal text-based documents are the priority. Image-only/scanned files are rejected rather than pretending OCR succeeded.

## AI architecture

Groq is the reasoning layer for:

1. Course-to-roadmap extraction
2. Diagnostic question generation
3. Response evaluation and prerequisite-gap diagnosis
4. Targeted micro-lesson generation
5. Fresh retest generation
6. Live learning-resource discovery via Groq Compound web search

The resource search uses `groq/compound-mini` because Groq's Compound systems provide built-in web search and citations without requiring us to maintain a separate search infrastructure.

## Reliability strategy

The recorded demo uses a deterministic demo course so the visual story is repeatable. The actual AI mechanism remains available for live experimentation. This is intentional: demo reliability should not depend on a PDF conversion or a network search finishing on camera.

## Testing

```bash
npm run typecheck
npm test
npm run build
```

## Limitations

- Resource quality depends on the current web search results for live uploads.
- AI-estimated understanding is an application-level signal, not validated educational measurement.
- MarkItDown ingestion prioritizes text-based course documents.
- The local workflow requires Python for MarkItDown and Node for the UI/API bridge.

## Hackathon story

**Problem:** students can see the topic they are failing but not the prerequisite they are missing.

**Solution:** ConceptAtlas turns the syllabus into a path, attaches a useful learning pack to every node, and gives learners a targeted escape hatch when they are stuck.

**Pitch:**

> **ConceptAtlas turns any syllabus into a learning roadmap—then uses AI to help you choose what to learn next and what to revisit when you're stuck.**
