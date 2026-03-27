<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# UI Implementation

Before coding any UI component or page, open and read the corresponding `.pen` design file using the `mcp__pencil__open_document` and `mcp__pencil__batch_get` tools. The `.pen` file is the source of truth for colors, spacing, typography, layout, and component structure. Never hardcode visual values from memory — always derive them from the design file.

**Mobile mockup chrome — do not implement:** The iOS-style status bar (showing static time "9:41", signal, wifi, and battery icons) that appears at the top of mobile screen mockups is design decoration only. It simulates a real phone screen for visual context. Do NOT render it as app UI.
