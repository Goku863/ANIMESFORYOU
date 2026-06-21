# AnimeStream — AI-Powered Anime Streaming Platform

> Built with transitions-dev CSS animations, AI recommendations powered by Fable 5 behavioral patterns, and n8n automation workflows.

## Features

### Core Streaming
- **Hero Section** — Rotating anime backgrounds with staggered text reveal animations
- **Anime Grid** — 18+ anime titles with hover card animations and play overlays
- **Continue Watching** — Progress tracking with visual progress bars
- **Streaming Player** — Full controls, progress seek, fullscreen, subtitles toggle

### AI Assistant (Fable 5 Enhanced)
The AI assistant incorporates behavioral patterns from Claude Fable 5's system prompt:

- **Decision Rules** — Examples beat rules. Lead with outcomes, not preamble.
- **Context Awareness** — Tracks user preferences across conversation
- **Recommendation Logic** — Weighted similarity scoring (genre 0.3, narrative 0.25, tone 0.2, ratings 0.15, recency 0.1)
- **Response Scaling** — Simple questions get 1-2 sentences, complex research gets detailed analysis
- **Copyright Compliance** — Never reproduces lyrics, poems, or long quotes

### n8n Automation Hub
Six integrated workflows powering the platform:

| Workflow | Description |
|----------|-------------|
| AI Recommendation Engine | GPT-4 analyzes watch history for personalized picks |
| RSS Feed Sync | Hourly fetch from anime databases for new releases |
| Smart Notifications | Push alerts for new episodes of followed series |
| Watch Analytics | Track viewing patterns and generate insights |
| Multi-Source Aggregator | Merge streams from 12+ providers |
| Cloud Backup | Sync watchlist and progress across devices |

### transitions-dev Integration
All 18 CSS transitions from transitions.dev are implemented:

| Transition | Usage |
|------------|-------|
| Card Resize | Anime card hover lift + scale |
| Number Pop-in | Episode counters, ratings |
| Notification Badge | Bell icon badge with slide-in |
| Text States Swap | Hero meta text transitions |
| Menu Dropdown | Search results, notification panel |
| Modal Open/Close | Anime detail modal with scale |
| Panel Reveal | AI assistant slide-in panel |
| Page Side-by-Side | Home ↔ Player transitions |
| Icon Swap | AI assistant icon toggle |
| Success Check | Watchlist add/remove toast |
| Avatar Group Hover | Cast/crew avatar stacks |
| Error State Shake | Search input validation |
| Input Clear Dissolve | Search clear button fly-out |
| Skeleton Loader | Loading placeholders |
| Shimmer Text | "AI Recommended" shimmer |
| Tabs Sliding | Segmented genre tabs |
| Tooltip | Navigation icon tooltips |
| Texts Reveal | Hero content stagger |

## Project Structure

```
animestream/
├── index.html              # Main SPA
├── css/
│   ├── transitions.css     # All 18 transitions-dev CSS
│   └── main.css            # Design system + layout
├── js/
│   └── app.js              # App logic, AI, n8n, player
├── n8n-workflows/          # n8n workflow JSON configs
│   ├── ai-recommendation.json
│   ├── rss-feed-sync.json
│   └── smart-notifications.json
├── ai-system-prompt.md     # Fable 5 enhanced system prompt
└── package.json
```

## Quick Start

```bash
cd /root/animestream
python3 -m http.server 8080
# Open http://localhost:8080
```

## AI System Prompt

The AI assistant uses a system prompt enhanced with Claude Fable 5's behavioral framework:

- **Tone**: Warm, direct, decisive. No excessive preamble.
- **Decision Making**: Examples beat rules. Lead with outcomes.
- **Safety**: Child safety, copyright compliance, user wellbeing.
- **Search**: Scales tool calls to query complexity.
- **Copyright**: 15-word quote limit, 1 quote per source max.

See `ai-system-prompt.md` for the full prompt.

## n8n Workflows

Import the workflow JSON files from `n8n-workflows/` into your n8n instance:

1. `ai-recommendation.json` — OpenAI GPT-4 powered recommendations
2. `rss-feed-sync.json` — Scheduled RSS + MongoDB + Slack
3. `smart-notifications.json` — Push notifications on new episodes

## Technologies

- **Frontend**: Vanilla HTML/CSS/JS (no framework dependencies)
- **Animations**: transitions-dev CSS transitions
- **AI**: Fable 5 behavioral patterns + contextual response generation
- **Automation**: n8n workflow integration
- **Design**: Custom dark mode design system

## License

MIT
