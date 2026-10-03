# Aria – Voice Support Agent for Aura Skincare

Browser-based voice agent. Click **Start Call**, talk to Aria, click **End Call** to get the transcript and a JSON summary.
No LLM and no API keys: the whole agent is plain Python.

## Stack
- Frontend: Vite + React
- Backend: Flask (also serves the built frontend, so one deploy)
- Speech-to-text and text-to-speech: browser Web Speech API (`en-IN`), Chrome or Edge
- Agent: rule-based dialogue manager in `backend/agent.py` (regex intent detection, entity extraction, templated replies)
- Data: in-memory mock orders in `backend/orders.py`

## Architecture
```
Mic -> SpeechRecognition (browser) -> POST /api/chat {text, context}
                                         |
                       agent.respond(): detect intent -> extract order ID / days / opened
                                         -> call tools (get_order_details, cancel_order) -> pick reply template
                                         |
Speakers <- speechSynthesis (browser) <- {reply, context}
```
- The server is stateless. The browser sends back the `context` (last order, pending question, what has happened so far) with each turn.
- UI state machine: Listening -> Thinking -> Speaking -> Listening.
- On End Call, `/api/summary` builds the JSON outcome from the context. No model involved.

## Run
```bash
./run.sh      # macOS / Linux
run.bat       # Windows
```
Then open http://localhost:5173 in Chrome or Edge. Manual run: `python app.py` in `backend`, `npm run dev` in `frontend`.

## Deploy on Vercel (one repo, one project)
1. Push the whole folder to GitHub (frontend, backend, api, vercel.json).
2. Vercel -> Add New Project -> import the repo. Leave the framework preset as "Other"; `vercel.json` sets the build and output.
3. Deploy. The React app is served as static files and `/api/*` is handled by `api/index.py`, which loads the Flask app from `backend/`. Same domain, so no CORS or env vars needed.

The agent keeps no server state (call context lives in the browser), which is why it works on serverless.

## Deploy on Render (alternative)
Create a Blueprint from `render.yaml`. Needs HTTPS for the microphone, which both platforms provide.

## How the requirements are met
- **Order lookup:** `get_order_details` is called whenever an order ID is heard ("ORD 101", "order one zero one", "ord-101" all work). Missing ID -> asks for it. Unknown ID -> asks to verify.
- **Policy:** return rules check days and opened/unopened status; cancellation checks order status in code and asks for confirmation first.
- **Out of scope / unknown:** off-topic words get a polite refusal; skincare questions the agent has no data on get "I don't have that information".
- **Unclear audio:** low-confidence recognition results get a "could you repeat?" reply.
- **Hinglish:** a few Hinglish keywords are recognised (kahan, kab aayega, wapas, haan, nahi); replies are in English.
- **Interrupt:** an Interrupt button stops Aria while she speaks.

## Section 9 – How I think (edit in your own words before submitting)
1. **Architecture:** I wanted something deterministic, free and fast. Browser speech APIs remove network hops for voice, and a rule-based dialogue manager gives instant replies and makes policy enforcement exact: the agent cannot be talked into a refund because the reply comes from code, not a model. The cost is narrower language understanding.
2. **Hardest part:** Keeping a conversation coherent without an LLM: follow-ups like "yes", "it's unopened" or a bare "101" only make sense with context. I solved it with a small context object (pending question, last order, topic) that the client returns each turn, so the server stays stateless.
3. **One more week:** Add an LLM only for understanding (intent and entity extraction) while keeping the same code-enforced policy and tools. This handles free-form phrasing, and the guardrails stay deterministic. Then streaming speech and true barge-in.
4. **At 1,000 calls/day:** Store calls and summaries in Postgres, add auth and rate limiting, move to server-side streaming speech for consistent quality across browsers, log unrecognised utterances to grow the intent coverage, add regression tests for conversations, and hand off to a human when the agent is unsure.
