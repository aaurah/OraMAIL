import { Router } from "express";
import { db } from "@workspace/db";
import { apiKeysTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import crypto from "crypto";

const router = Router();

function generateApiKey(): { key: string; prefix: string; hash: string } {
  const raw = crypto.randomBytes(24).toString("hex");
  const key = `ora_${raw}`;
  const prefix = `ora_${raw.slice(0, 6)}`;
  const hash = crypto.createHash("sha256").update(key).digest("hex");
  return { key, prefix, hash };
}

router.get("/api-keys", async (req, res) => {
  const keys = await db
    .select({
      id: apiKeysTable.id,
      name: apiKeysTable.name,
      keyPrefix: apiKeysTable.keyPrefix,
      isActive: apiKeysTable.isActive,
      lastUsedAt: apiKeysTable.lastUsedAt,
      createdAt: apiKeysTable.createdAt,
    })
    .from(apiKeysTable)
    .orderBy(desc(apiKeysTable.createdAt));

  res.json({ keys });
});

router.post("/api-keys", async (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return res.status(400).json({ error: "name is required" });
  }

  const { key, prefix, hash } = generateApiKey();

  const [created] = await db
    .insert(apiKeysTable)
    .values({
      name: name.trim(),
      keyPrefix: prefix,
      keyHash: hash,
      isActive: true,
    })
    .returning({
      id: apiKeysTable.id,
      name: apiKeysTable.name,
      keyPrefix: apiKeysTable.keyPrefix,
      isActive: apiKeysTable.isActive,
      createdAt: apiKeysTable.createdAt,
    });

  res.status(201).json({ ...created, key });
});

router.delete("/api-keys/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "invalid id" });

  await db.delete(apiKeysTable).where(eq(apiKeysTable.id, id));
  res.json({ success: true });
});

router.patch("/api-keys/:id/revoke", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "invalid id" });

  const [updated] = await db
    .update(apiKeysTable)
    .set({ isActive: false })
    .where(eq(apiKeysTable.id, id))
    .returning({ id: apiKeysTable.id, isActive: apiKeysTable.isActive });

  if (!updated) return res.status(404).json({ error: "not found" });
  res.json(updated);
});

export default router;
