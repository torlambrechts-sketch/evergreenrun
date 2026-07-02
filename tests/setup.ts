import { config } from "dotenv";

// Load .env.local first (developer machine), then .env as a fallback.
config({ path: ".env.local" });
config();
