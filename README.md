# Minecraft AI Add-on Studio v2

This version adds an actual ZIP package generator.

## Setup
npm install
npm run dev

No AI provider key is needed for the deterministic starter pack generator. To add real multi-model AI generation, connect your preferred provider on the server side and feed its structured output into `/api/build-addon`.

The package generator creates a Behavior Pack, Resource Pack, manifests, Script API starter, README and QA report, then downloads them as a ZIP.
