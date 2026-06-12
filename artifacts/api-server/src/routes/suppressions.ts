import { Router } from "express";
import { db } from "@workspace/db";
import { suppressionsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { AddSuppressionBody, ListSuppressionsQueryParams, DeleteSuppressionParams } from "@workspace/api-zod";

const router = Router();

router.get("/suppressions", async (req, res) => {
  const query = ListSuppressionsQueryParams.parse(req.query);
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const offset = (page - 1) * limit;

  const [suppressions, countResult] = await Promise.all([
    db.select().from(suppressionsTable).orderBy(suppressionsTable.createdAt).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(suppressionsTable),
  ]);

  const total = Number(countResult[0]?.count ?? 0);

  res.json({
    suppressions: suppressions.map((s) => ({ ...s, createdAt: s.createdAt.toISOString() })),
    total,
    page,
    limit,
  });
});

router.post("/suppressions", async (req, res) => {
  const body = AddSuppressionBody.parse(req.body);

  const [existing] = await db.select().from(suppressionsTable).where(eq(suppressionsTable.email, body.email));
  if (existing) {
    res.status(201).json({ ...existing, createdAt: existing.createdAt.toISOString() });
    return;
  }

  const [suppression] = await db.insert(suppressionsTable).values({
    email: body.email,
    reason: body.reason as typeof suppressionsTable.reason._.data,
  }).returning();

  res.status(201).json({ ...suppression, createdAt: suppression.createdAt.toISOString() });
});

router.delete("/suppressions/:id", async (req, res) => {
  const { id } = DeleteSuppressionParams.parse(req.params);
  await db.delete(suppressionsTable).where(eq(suppressionsTable.id, id));
  res.status(204).send();
});

export default router;
