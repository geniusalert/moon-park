# Moon Park AI planner

The AI planner turns text and clearly labeled images into a validated request for the existing navigator. It can fill controls, select up to three sites, calculate results, change the visual view, shortlist passing tested sites and search arrival alternatives. Manual controls remain available.

## Configure Meta

Edit the root `.env` file, which has been created from `.env.example` with no key:

```dotenv
META_API_KEY=your_key_here
META_API_BASE_URL=https://api.meta.ai/v1
META_MODEL=muse-spark-1.3
META_API_FORMAT=meta
```

The service reads `.env` for each AI request, so a key update does not require restarting the navigator. Select **Check connection** to refresh the configured indicator; this indicator checks local configuration, not remote authentication. An actual request verifies remote access. Shell environment variables take precedence over `.env`. `MODEL_API_KEY` and `LLAMA_API_KEY` are accepted aliases.

If your account uses the older Meta Llama API, use `META_API_FORMAT=llama`, `META_API_BASE_URL=https://api.llama.com/v1` and a model available to that account, for example `Llama-4-Maverick-17B-128E-Instruct-FP8`. The adapter supports that API's `completion_message` response envelope. Keys, models and endpoint formats must belong to the same service. Only the two official Meta hosts are accepted.

Official references checked during implementation:

- [Meta Model API reference](https://dev.meta.ai/docs/api-reference)
- [Meta image inputs](https://dev.meta.ai/docs/media-understanding)
- [Meta structured output](https://dev.meta.ai/docs/structured-output)
- [Legacy Meta Llama TypeScript API](https://github.com/meta-llama/llama-api-typescript)

## Use it

1. Type a request into **Plan with AI**. Optionally attach up to two PNG, JPEG or WebP images, each up to 3 MB.
2. Select **Plan & run**. The assistant shows its interpretation, assumptions and extracted inputs. Clear **Run supported requests automatically** if you prefer reviewing the action before selecting **Run this request**.
3. When inputs are ambiguous, reply to the clarification question in the same box. Unsupported dates are not rounded or silently moved into 2027.
4. Calculations use the ordinary local queue, source data and caches. Loading progress, cancellation and errors are the same as in manual planning. **Stop** aborts an AI request and, if it has started calculations, cancels that work.
5. The requested visual tab, inspection and comparison update with real results. **Undo AI settings** restores the previous workspace settings and follows the existing source-checked restoration/calculation process.

Example requests:

- “Compare Shackleton rim and de Gerlache rim for a 72-hour stay arriving 21 June 2027 at 12:00 UTC. Use a 5 m observer and show the horizon.”
- “I reach the Moon on 21 June 2027 at 12:00 UTC. Compare Apollo 11, Apollo 12 and Apollo 14 using a reference sphere. Which tested choice meets my current visibility requirements?”
- “At Apollo 12, find a passing arrival in the 72 hours before 24 June 2027 at 12:00 UTC, for a 48-hour stay. Show the timeline.”
- “Read the printed latitude, longitude and mission date from this image. Ask me if a label is unclear.”
- “Why does the selected location lose direct Earth visibility? Explain the displayed result without changing settings.”

## Execution and scientific boundaries

The provider returns schema-constrained data. Server and browser validate it against allowed actions, authoritative catalogue IDs, coordinate ranges, supported times, heights and requirements. Model output never becomes executable JavaScript, shell commands or unrestricted browser actions. Catalogue names cannot override their recorded coordinates.

New AI calculations use 2027 arrivals on the ten-minute input grid, supported observer heights, and stays of 1–168 h. The current cadence setting is retained. A site shortlist evaluates at most three named/custom choices at the same arrival. Passing sites rank by longest continuous shared window, then total shared availability; tied metrics are identified. A failed or unavailable case cannot be recommended as passing.

Arrival searches use additional delays 0–72 h in 12 h steps with observer height fixed. With a specified arrival deadline, the search starts 72 h before that deadline. A window extending outside 2027 requires clarification. The first passing alternative follows the existing ranking: least additional delay, then longest continuous shared window, then total shared availability. The selected alternative is shown as a temporary visual preview. The input controls retain the search baseline until **Apply arrival** is selected in the date grid. All tested cells remain visible there.

Ranking requires a common calculation model. A mix of polar terrain and global reference-sphere results must be resolved explicitly before ranking. Open-ended recommendations are limited to the actual tested choices; they are not global optimization or landing approval. Launch trajectories, flight time, hazards and full operational feasibility are not inferred.

Image understanding extracts printed inputs. It does not register an image to lunar terrain, infer geographic location from an unlabeled crater, measure hazards, or substitute imagery for the DEM. Uncertain image labels require clarification. AI explanations are labeled separately from deterministic calculated-result messages.

## Data and credentials

Messages, attached image bytes, recent conversation turns and compact current scenario summaries are sent to the configured Meta service only after submission. Scientific rasters and kernels are not uploaded. The application does not write image uploads or conversation transcripts to disk. Chat state is in browser memory; refreshing or starting a new conversation clears it. The normal workspace/export records the applied scenario and calculation identities, not the AI transcript or attached files.

The key is read only on the local server. `.env` is ignored by Git and excluded from release packaging; dotfiles and repository metadata are blocked by the static server. Provider errors are mapped to local messages without returning upstream bodies or credentials. No key or account access is bundled. Meta's own service retention policies still apply.

## Verification and remaining limit

Twenty-two targeted Node checks passed for plan validation, provider request/response envelopes, image validation, invalid/ambiguous settings, source coordinate identity, ranking, authentication errors, progress states and retained navigator regression. Provider calls were mocked; no live Meta key was available. A separately labeled test fixture exercised scripted AI plans through actual local scientific jobs and the browser controls. Its responses are not evidence of Meta's natural-language or image extraction accuracy. The browser fixture completed a two-site comparison, a seven-cell deadline arrival search with timeline preview, image attachment/submission, tied passing site ranking, and restoration of the previous AI settings.

Live text interpretation, live image extraction and account/model availability require a configured Meta key. Human usability testing and independent scientific review remain separate.
