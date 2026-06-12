import { Router } from "express";
import { db } from "@workspace/db";
import { templatesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateTemplateBody, GetTemplateParams, UpdateTemplateParams, UpdateTemplateBody, DeleteTemplateParams } from "@workspace/api-zod";

const router = Router();

router.get("/templates", async (_req, res) => {
  const templates = await db.select().from(templatesTable).orderBy(templatesTable.createdAt);
  res.json(templates.map((t) => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  })));
});

router.post("/templates", async (req, res) => {
  const body = CreateTemplateBody.parse(req.body);
  const [template] = await db.insert(templatesTable).values({
    name: body.name,
    subject: body.subject,
    htmlBody: body.htmlBody ?? null,
    textBody: body.textBody ?? null,
    description: body.description ?? null,
  }).returning();

  res.status(201).json({
    ...template,
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
  });
});

router.get("/templates/:id", async (req, res) => {
  const { id } = GetTemplateParams.parse(req.params);
  const [template] = await db.select().from(templatesTable).where(eq(templatesTable.id, id));

  if (!template) {
    res.status(404).json({ error: "Template not found" });
    return;
  }

  res.json({ ...template, createdAt: template.createdAt.toISOString(), updatedAt: template.updatedAt.toISOString() });
});

router.patch("/templates/:id", async (req, res) => {
  const { id } = UpdateTemplateParams.parse(req.params);
  const body = UpdateTemplateBody.parse(req.body);

  const [template] = await db.update(templatesTable)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(templatesTable.id, id))
    .returning();

  if (!template) {
    res.status(404).json({ error: "Template not found" });
    return;
  }

  res.json({ ...template, createdAt: template.createdAt.toISOString(), updatedAt: template.updatedAt.toISOString() });
});

router.delete("/templates/:id", async (req, res) => {
  const { id } = DeleteTemplateParams.parse(req.params);
  await db.delete(templatesTable).where(eq(templatesTable.id, id));
  res.status(204).send();
});

export default router;
