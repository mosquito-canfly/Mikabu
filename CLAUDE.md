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
- Study notes: paste text only. PDF upload comes later.
- Conversation memory: ON. Full session history is sent each turn.
- AI backend: Gemini free tier for the prototype.

## v1 scope
Create a character → chat with them → toggle to study mode → paste notes →
get an explanation and a quiz. Nothing beyond this until v1 works.

## Conventions
- Commit messages: Conventional Commits style with point-form descriptions.
- Do not reference this CLAUDE.md file in commit messages.
- Keep changes tightly scoped to the current step; do not build ahead.

## Build progress
- [x] Step 1: Project scaffold, types, CLAUDE.md
- [x] Step 2: Character creation form + localStorage
- [x] Step 3: Home page (character selection)
- [x] Step 4a: AI backend wiring (prompt builder, Gemini client, chat API)
- [x] Step 4b: Chat mode UI with memory
- [x] Step 5: Study mode (explain + quiz)
- [ ] Step 6: Mode toggle + polish
