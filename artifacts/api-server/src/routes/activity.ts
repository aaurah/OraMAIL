import { Router } from "express";
import { db } from "@workspace/db";
import { activityTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { GetActivityQueryParams } from "@workspace/api-zod";

const router = Router();

router.get("/activity", async (req, res) => {
  const query = GetActivityQueryParams.parse(req.query);
  const limit = query.limit ?? 50;

  const events = await db
    .select()
    .from(activityTable)
    .orderBy(desc(activityTable.createdAt))
    .limit(limit);

  res.json(events.map((e) => ({
    ...e,
    createdAt: e.createdAt.toISOString(),
  })));
});

export default router;
