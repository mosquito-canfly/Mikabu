<div align="center">
  <img src="public/logo.png" alt="Mikabu logo" width="110" />

  # Mikabu

  *Your character, your story*

  **[mikabu.vercel.app](https://mikabu.vercel.app/)**
</div>

---

## What it is

Mikabu lets you design a character from scratch — their personality, age, occupation,
who they are to you, the world they live in, how they talk — and then just... talk to
them. No preset personas, no generic assistant voice. You build them, they stay in
character.

Here's the twist: the same character can also teach you. Paste your notes (or hand them
a PDF or a photo of your slides) and flip to study mode, and they'll explain the
material, quiz you on it, or summarize it — all without dropping the voice you gave
them. Your slightly sarcastic tutor stays slightly sarcastic while explaining
photosynthesis. Built for students who'd rather study with *someone* than stare at a
wall of notes alone.

## Features

- **Character creation** — name, gender, age, a multi-select set of personality traits
  (with a free-text "Other" option), occupation, relationship to you, the world they
  live in, speaking style, and optional extra notes. Required fields are enforced before
  a character can be created.
- **Chat mode** — natural in-character conversation with full memory: the entire
  conversation history is sent back to the model on every turn, so the character
  actually remembers what you talked about. Multiple chat sessions per character, each
  auto-titled from your first message, with a sidebar to switch, rename, or delete them.
  A reply in progress can be cancelled mid-flight with a Stop button.
- **Study mode** — paste notes and/or attach files, then pick a tool:
  - **Explain** — a thorough, plain-prose explanation in the character's voice.
  - **Quiz** — five multiple-choice questions, scored live with clear correct/incorrect
    states once you've answered.
  - **Summary** — a concise recap of the material.

  Every result you generate stays in a running log for that session — asking for a quiz
  after an explanation doesn't erase the explanation.
- **PDF and image upload** — attach PDF, PNG, JPEG, or WEBP files (up to 10MB each,
  multiple at once, drag-and-drop or file picker) alongside or instead of pasted notes.
  Files are sent to the model natively — there's no client-side text extraction, so the
  model reads the actual document or image. File *contents* never touch localStorage;
  only the file metadata is saved, so a re-opened session shows attached files as
  "needs re-attaching" rather than silently pretending they're still usable.
- **Session history** — chat and study sessions are tracked separately per character,
  sorted by most recently updated, with inline rename and delete-with-confirmation.
  Study sessions auto-number ("New study 1", "New study 2", ...) using a per-character
  counter that only ever increments, so a number is never reused even after deleting a
  session.

## Preview

| Home (first visit) | Creating a character |
| --- | --- |
| ![Home screen with no characters yet](docs/home-empty.png) | ![Character creation form](docs/create-character.png) |

| Home (with a character) | Chat mode | Study mode |
| --- | --- | --- |
| ![Home screen with a character card](docs/home.png) | ![Chat mode conversation](docs/chat-mode.png) | ![Study mode with notes and sessions](docs/study-mode.png) |

## Tech stack

| Technology | Role |
| --- | --- |
| [Next.js](https://nextjs.org/) (App Router) | Framework — pages, layouts, and API routes |
| [TypeScript](https://www.typescriptlang.org/) | Type safety across the app |
| [React](https://react.dev/) | UI |
| [Tailwind CSS](https://tailwindcss.com/) | Styling, via a small custom design-token theme |
| [Google Gemini API](https://ai.google.dev/) | The model powering chat replies and study tools |
| `localStorage` | Persistence — characters, sessions, and study metadata |
| [Vercel](https://vercel.com/) | Hosting |

## Architecture

A few decisions shape how the codebase is put together:

**The API key never reaches the browser.** Every AI call goes through a Next.js API
route (`app/api/chat`, `app/api/study`) that runs server-side and reads
`GEMINI_API_KEY` from the environment. The client only ever talks to these routes —
it never holds a key or calls Gemini directly.

**The AI provider is a one-file swap.** `lib/ai/client.ts` is the only file in the
codebase allowed to import the provider SDK (`@google/genai`). Every feature calls its
exported functions (`generateChatReply`, `generateStudyResponse`) instead of touching
the SDK itself, so switching models — or providers entirely — means changing this one
file.

**One persona, two modes.** `lib/ai/promptBuilder.ts` compiles a `Character` into a
system prompt once (`buildSystemPrompt`), and both chat and study mode build on top of
it. Study mode doesn't get its own separate personality — it layers a task ("explain
this", "quiz me on this") onto the exact same persona, so the character can't drift
between the two modes.

```
app/
├── api/
│   ├── chat/route.ts        # POST — chat replies
│   └── study/route.ts       # POST — explain / quiz / summary
├── chat/[characterId]/page.tsx  # character page (chat + study toggle)
├── create/page.tsx          # character creation
├── globals.css              # design tokens, base styles
├── icon.png                 # app icon / favicon
├── layout.tsx                # root layout, font, metadata
└── page.tsx                  # home page (character list)
components/
├── character/
│   ├── CharacterCard.tsx
│   └── CharacterForm.tsx
├── chat/
│   ├── ChatInput.tsx
│   ├── ChatWindow.tsx
│   └── MessageBubble.tsx
├── study/
│   ├── NotesUpload.tsx
│   ├── QuizView.tsx
│   ├── StudyPanel.tsx
│   └── StudyToolbar.tsx
├── LoadingBar.tsx
├── Logo.tsx
├── MarkdownContent.tsx
├── ModeToggle.tsx
└── SessionSidebar.tsx        # shared sidebar used by both modes
lib/
├── ai/
│   ├── client.ts             # only file that imports the provider SDK
│   └── promptBuilder.ts      # persona + task prompt construction
├── storage.ts                 # localStorage read/write for characters & sessions
└── types.ts                   # shared TypeScript types
public/
└── logo.png                   # logo used in the in-app lockup
```

## Running it locally

**Requirements:** Node.js 20 or later.

```bash
git clone https://github.com/mosquito-canfly/Mikabu.git
cd Mikabu
npm install
```

Create a `.env.local` file in the project root:

```
GEMINI_API_KEY=your_key_here
```

A free key from [Google AI Studio](https://aistudio.google.com/) is enough to run the
app — no paid tier required.

> **Never commit `.env.local` or your API key.** `.env*` is already listed in
> `.gitignore`; keep it that way.

Then start the dev server:

```bash
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

## Deploying

The live app is deployed on [Vercel](https://vercel.com/):

1. Import the repository into Vercel.
2. Add `GEMINI_API_KEY` as an environment variable in the project's settings.
3. Deploy.

Environment variable changes only take effect on the **next** deployment — updating
the value in Vercel's dashboard won't affect a deployment that's already running until
you redeploy.

## Design

Colors are defined once as CSS variables and used consistently everywhere — nothing
outside this set appears in the UI:

| Token | Value | Used for |
| --- | --- | --- |
| `--paper` | `#ffffff` | Base background |
| `--star` | `#f0efaf` | Chat mode accent |
| `--sky` | `#a7e1f2` | Study mode accent |
| `--ink` | `#2b2b33` | Primary text and solid buttons |

The whole app is set in [Fredoka](https://fonts.google.com/specimen/Fredoka), a
rounded, friendly sans-serif — no other typeface is used, for buttons, inputs, or
message bubbles alike. Chat and study mode share the exact same layout; only the
accent color changes between them, so switching modes reads as the light in the room
changing rather than landing in a different app.
