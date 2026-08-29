# ConceptAtlas

**The learning roadmap your syllabus never gave you.**

ConceptAtlas turns a real course syllabus into an interactive, step-by-step learning roadmap. Click any topic to get a focused resource pack—free, paid, practice, books, projects, and videos. When a learner is stuck, ConceptAtlas can diagnose the prerequisite worth revisiting instead of simply repeating the topic.

# Notion:
https://app.notion.com/p/ConceptAtlas-3cb62c13fa8480a58b12c1f28dced26b?source=copy_link

# Video Demo
https://vimeo.com/1222278643?fl=pl&fe=cm

## The Product in One Picture

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

ConceptAtlas deliberately avoids a vector database/RAG stack for the core syllabus transformation. The syllabus is converted once, analyzed into a compact course model, and the roadmap becomes the main product surface.

## Why It Is Different

roadmap.sh demonstrates the value of visual learning paths, interactive nodes, and resources. ConceptAtlas applies that interaction pattern to a student's **own syllabus**.

The student does not start by searching the web. They start with the course they actually need to finish.

The signature action is **I'm Stuck**:

> **Stuck? → diagnose → identify likely prerequisite → teach a micro-lesson → retest**

ConceptAtlas uses roadmap dependencies plus the learner's response to choose the smallest plausible prerequisite gap.

## Resource Pack

Each roadmap node can contain:

- Best free resource
- Best paid/structured resource
- Practice/labs
- Books
- Hands-on project
- Video explanation
- Additional reference

For demo topics, resources are curated and deterministic so a recorded demo is stable.

For live uploaded syllabi, `/api/resources` uses **Groq Compound Mini with web search**. The application only keeps URLs returned by the search system rather than inventing links from model memory.

---

## Local Setup

### Prerequisites

Install:

- Node.js 20+
- Python 3.10+
- Git
- A Groq account

The live AI features require a **Groq API key**.

### Create a Groq Account

Go to:

https://console.groq.com/

Create an account or sign in.

After signing in, open the **API Keys** section:

https://console.groq.com/keys

Choose **Create API Key**.

Give the key a recognizable name, such as:

```text
ConceptAtlas
```

Copy the generated key immediately and keep it private.

### Important Security Rules

**Never:**

- Paste the key into React code.
- Put the key in a `VITE_` environment variable.
- Commit the key to GitHub.
- Put the key into this README.
- Upload `.env.local` to source control.

ConceptAtlas sends Groq requests through its server-side API handlers.

---

## Create the Python Environment

From the ConceptAtlas project directory:

```powershell
py -3 -m venv .venv
```

Activate it:

```powershell
.venv\Scripts\activate
```

You should see `(.venv)` at the beginning of your terminal prompt.

Then install the Python dependencies:

```powershell
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

Verify MarkItDown:

```powershell
python -c "from markitdown import MarkItDown; print('MarkItDown OK')"
```

Expected output:

```text
MarkItDown OK
```

---

## Install Node Dependencies

```powershell
npm install
```

---

## Configure Groq

Copy:

```text
.env.example
```

to:

```text
.env.local
```

Then add your Groq key:

```env
GROQ_API_KEY=your_actual_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-20b
```

Do **not** add `VITE_` before `GROQ_API_KEY`.

The key must remain server-side.

---

## Start ConceptAtlas

Make sure the Python virtual environment is activated:

```powershell
.venv\Scripts\activate
```

Then start the development server:

```powershell
npm run dev
```

Open the local URL shown by Vite, normally:

http://localhost:5173

You can also use:

```text
run-local.bat
```

The Vite development server includes the local `/api/*` bridge, including `/api/convert-file`. This allows the local application to exercise the document-processing and AI routes without requiring a separate backend process.

---

# Test the Supplied Syllabus

A sample syllabus corpus is included in:

```text
syllabus/
```

This folder contains the **VTU Information Science and Engineering (ISE)** syllabus used to test ConceptAtlas with a realistic university curriculum.

Use these files to test the complete pipeline instead of relying only on the built-in demo course.

### Intended Test Flow

```text
VTU ISE syllabus
        ↓
Upload into ConceptAtlas
        ↓
MarkItDown
        ↓
Markdown
        ↓
Groq
        ↓
Course concepts
        ↓
Learning roadmap
        ↓
Select a concept
        ↓
Resource Pack
        ↓
Optional "I'm Stuck" diagnosis
```

This provides a realistic test of the application against an actual engineering curriculum rather than a synthetic example.

---

# File Ingestion

The upload path is:

```text
PDF / DOCX / PPTX / XLSX / CSV / TXT / MD / HTML
        ↓
    MarkItDown
        ↓
      Markdown
        ↓
Syllabus compression
        ↓
       Groq
```

Normal text-based documents are the priority.

Image-only/scanned documents are rejected rather than pretending that OCR succeeded.

The syllabus is converted before being sent to the reasoning layer. Raw PDF bytes are **not** sent directly to Groq.

---

# AI Architecture

Groq is the reasoning layer for:

- Course-to-roadmap extraction
- Concept and dependency analysis
- Diagnostic question generation
- Student-response evaluation
- Prerequisite-gap diagnosis
- Targeted micro-lesson generation
- Fresh retest generation
- Learning-resource discovery

The resource search uses **Groq Compound Mini with web search** for live resource discovery.

For live resources, ConceptAtlas can look for:

- Free learning resources
- Paid structured courses
- Practice sites/labs
- Books
- Project ideas
- Video explanations
- Additional references

The application ranks resources for usefulness and relevance to the selected concept rather than simply returning generic Google, Wikipedia, or YouTube links.

---

# Recommendation Logic

The roadmap is not just a list of extracted topics.

ConceptAtlas uses course relationships to determine what is useful to learn next.

A simplified recommendation signal considers:

```text
prerequisite relevance
        ×
dependency confidence
        ×
concept importance
        ×
learner state
```

When a learner selects a concept, the system can therefore distinguish between:

```text
START HERE
```

and:

```text
REVISIT THIS PREREQUISITE FIRST
```

The goal is not to claim scientifically validated mastery. Any percentage shown by the product is an **AI-estimated understanding signal**.

---

# Reliability Strategy

The recorded demo uses a deterministic demo course so the visual story is repeatable.

The actual AI pipeline remains available for live experimentation.

This is intentional:

> Demo reliability should not depend on PDF conversion, live web search, or a network request completing at exactly the right moment during a recording.

This makes the product reliable for a hackathon demonstration while preserving the genuine AI pipeline for real usage.

---

# Testing

Run:

```powershell
npm run typecheck
npm test
npm run build
```

For the Python document converter:

```powershell
python -m py_compile scripts\convert_file.py
```

---

# Security

ConceptAtlas keeps the Groq API key server-side.

Do not commit:

```text
.env
.env.local
.venv/
```

The repository includes:

```text
.env.example
```

with placeholders only.

Uploaded document content is treated as **untrusted source material**. Instructions embedded inside a syllabus are not trusted as application instructions.

---

# Limitations

- Resource quality depends on current web-search results for live uploads.
- AI-estimated understanding is an application-level signal, not a validated educational measurement.
- MarkItDown ingestion prioritizes text-based course documents.
- OCR is not required for the core flow.
- The local workflow requires Python for MarkItDown and Node for the UI/API bridge.
- Large syllabi are compressed before analysis to stay within model/request limits.
- Live resource discovery depends on network availability and the current search results returned by the resource-search system.

---

# Hackathon Story

## Problem

Students can see the topics in their syllabus, but they are often left to figure out:

1. **What should I learn first?**
2. **What resource should I use?**
3. **What should I practice?**
4. **What prerequisite am I missing when I get stuck?**

A syllabus tells students **what exists**, but usually not **how to learn it**.

## Solution

ConceptAtlas turns the syllabus into a structured learning path, attaches a useful resource pack to every concept, and gives learners a targeted escape hatch when they are stuck.

```text
SYLLABUS
   ↓
UNDERSTAND THE COURSE
   ↓
BUILD THE ROADMAP
   ↓
LEARN CONCEPT
   ↓
USE RESOURCES
   ↓
GET STUCK?
   ↓
DIAGNOSE THE GAP
   ↓
REVISIT PREREQUISITE
   ↓
MICRO-LESSON
   ↓
RETEST
   ↓
CONTINUE
```

## The Core Idea

> **Don't just tell students what is in the syllabus. Show them how to learn it—and help them find the missing prerequisite when they get stuck.**
