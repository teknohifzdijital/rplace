import type { Context, Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

const COLS = 80;
const ROWS = 50;
const TOTAL = COLS * ROWS;

function getCanvasStore() {
  return getStore({ name: "rplace-canvas", consistency: "strong" });
}

function emptyCanvas(): string[] {
  return Array(TOTAL).fill("#FFFFFF");
}

export default async (req: Request, context: Context) => {
  const store = getCanvasStore();

  if (req.method === "GET") {
    const data = await store.get("pixels", { type: "json" });
    const pixels = data ?? emptyCanvas();
    return Response.json({ pixels });
  }

  if (req.method === "POST") {
    const body = await req.json();
    const { index, color } = body;

    if (
      typeof index !== "number" ||
      index < 0 ||
      index >= TOTAL ||
      typeof color !== "string" ||
      !/^#[0-9a-fA-F]{6}$/.test(color)
    ) {
      return Response.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Read current, patch, write back
    const current: string[] = (await store.get("pixels", { type: "json" })) ?? emptyCanvas();
    current[index] = color;
    await store.setJSON("pixels", current);

    return Response.json({ ok: true });
  }

  return Response.json({ error: "Method not allowed" }, { status: 405 });
};

export const config: Config = {
  path: "/api/canvas",
};
