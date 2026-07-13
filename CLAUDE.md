# Mikabu

A personalized AI companion app. Users create a character (name, traits, hobbies,
interests, speaking style) and chat with an AI that behaves like that character.
Two modes share the same character personality:
- Chat mode: natural in-character conversation.
- Study mode: user pastes study notes; the character explains them, quizzes the
  user, and summarizes — all in the character's voice.

## Stack
Next.js (App Router) · React · TypeScript · Tailwind CSS

## Architecture principles
- The AI API key must stay server-side. All AI calls go through Next.js API
  routes (app/api/*). Never expose the key to the browser; never use a
  NEXT_PUBLIC_ prefix for it.
- lib/ai/client.ts is a swappable AI backend wrapper (Gemini free tier first,
  Anthropic later). Feature code must not call a provider SDK directly.
- lib/ai/promptBuilder.ts builds the system prompt from a Character. Both modes
  reuse it; the mode only changes the task appended to the character's persona.

## Locked decisions (v1)
- Persistence: localStorage only. Database + auth come later.
- Study material: pasted notes and/or attached PDF/image files, sent natively to
  the model. File contents are in-memory only — localStorage holds file metadata,
  not bytes.
- Conversation memory: ON. Full session history is sent each turn.
- AI backend: Gemini free tier for the prototype.

## v1 scope
Create a character → chat with them → toggle to study mode → paste notes →
get an explanation and a quiz. Nothing beyond this until v1 works.

## Conventions
- Commit messages: Conventional Commits style with point-form descriptions.
- Do not reference this CLAUDE.md file in commit messages.
- Keep changes tightly scoped to the current step; do not build ahead.

## Design system
Friendly, handwritten, engaging — for students and teenagers. Warm and playful,
not corporate, not childish.

- Tokens are defined once in app/globals.css as CSS variables (`--paper`, `--sky`,
  `--star`, `--ink`, `--muted`, `--line`) and mapped into Tailwind via `@theme inline`
  as `--color-*`, so they're usable as ordinary utilities: `bg-paper`, `text-ink`,
  `border-line`, `bg-sky`, `bg-star`, `text-muted`, etc. Do not introduce colors
  outside this set (red is kept only as an existing exception for the required-field
  asterisk and destructive/error states — delete actions, error banners).
      --paper: #ffffff   base background
      --sky:   #a7e1f2   STUDY mode accent
      --star:  #f0efaf   CHAT mode accent
      --ink:   #2b2b33   primary text, solid buttons
      --muted: #7c7c8a   secondary text, placeholders, helper text
      --line:  #e6e6ea   borders, dividers
  Accent tints (`--sky`, `--star`) are pale — text on an accent is always `--ink`,
  never `--paper`.
- Font: Fredoka everywhere, loaded via `next/font/google` in app/layout.tsx as the
  `--font-fredoka` variable (variable weight, no fixed `weight` prop needed), mapped
  to `--font-sans` and applied to `body`. Base font-size is the normal 16px root
  (no compensation bump) with `line-height: 1.5` on body — Fredoka is a rounded sans
  with real weights, not a handwriting face, so it reads comfortably at normal size.
  Weight is used deliberately: `font-bold` (700) for headings and the Mikabu
  wordmark, `font-medium` (500) for buttons, labels, and session titles, `font-normal`
  (400, the body default) for message bubbles and study output. The quiz's
  correct-answer highlight and score banner keep `font-bold` as part of the
  correct/incorrect state language (see below), not as a typography-scale choice.
- Mode color coding: the layout is identical between Chat and Study — only the
  accent changes. Chat leans `--star` (assistant bubbles, active session row, "New
  chat" button). Study leans `--sky` (active session row, "New study" button, tool
  buttons, result cards). components/SessionSidebar.tsx takes an `accent: "sky" |
  "star"` prop so the one shared sidebar component can carry either tint without
  duplicating it. The Chat/Study toggle shows the active mode in that mode's accent.
- Home page stays mostly paper/white; accents are used sparingly (e.g. character
  cards alternate a thin sky/star top border) rather than committing to one mode.
- Quiz correct/incorrect states are shown via symbol + weight + fill (✓ filled sky /
  ✗ outlined line-through), not via new green/red hues, to stay inside the palette.
- Global `:focus-visible` outline in globals.css is the baseline keyboard-focus
  guarantee; components layer `focus-visible:ring-2` in their mode's accent on top.
- `prefers-reduced-motion: reduce` disables/shortens transitions app-wide.

## Build progress
- [x] Step 1: Project scaffold, types, CLAUDE.md
- [x] Step 2: Character creation form + localStorage
- [x] Step 3: Home page (character selection)
- [x] Step 4a: AI backend wiring (prompt builder, Gemini client, chat API)
- [x] Step 4b: Chat mode UI with memory
- [x] Step 5: Study mode (explain + quiz)
- [x] Step 6a: Mode toggle and unified character page
- [x] Step 6b: Persist chat history
- [x] Step 7: Multi-session chat history with sidebar
- [x] Step 8: Bug fixes (sidebar dropdown, markdown rendering)
- [x] Step 9: Study sessions with history sidebar
- [x] Step 10: Behavior fixes (fresh chat on open, empty state, required markers, back button)
- [x] Step 11: Visual design pass (palette, Fredoka, mode theming)
- [x] Step 12: File upload in study mode (PDF and images)
- [x] Step 13: Mode-tinted loading bar
- [x] Step 14: Stop button, app icon, and metadata
