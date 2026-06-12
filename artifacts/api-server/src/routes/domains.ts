import { Router } from "express";
import { db } from "@workspace/db";
import { domainsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateDomainBody, GetDomainParams, DeleteDomainParams, VerifyDomainParams } from "@workspace/api-zod";
import { getEmailClient, isEmailConfigured } from "../lib/postmark";

const router = Router();

router.get("/domains", async (_req, res) => {
  const domains = await db.select().from(domainsTable).orderBy(domainsTable.createdAt);
  res.json(domains.map((d) => ({ ...d, createdAt: d.createdAt.toISOString() })));
});

router.post("/domains", async (req, res) => {
  const body = CreateDomainBody.parse(req.body);

  const [domain] = await db.insert(domainsTable).values({
    domain: body.domain,
    status: "unverified",
    spfVerified: false,
    dkimVerified: false,
    returnPath: `pm-bounces.${body.domain}`,
    dmarcRecord: `v=DMARC1; p=none; rua=mailto:dmarc@${body.domain}`,
  }).returning();

  res.status(201).json({ ...domain, createdAt: domain.createdAt.toISOString() });
});

router.get("/domains/:id", async (req, res) => {
  const { id } = GetDomainParams.parse(req.params);
  const [domain] = await db.select().from(domainsTable).where(eq(domainsTable.id, id));

  if (!domain) {
    res.status(404).json({ error: "Domain not found" });
    return;
  }

  res.json({ ...domain, createdAt: domain.createdAt.toISOString() });
});

router.delete("/domains/:id", async (req, res) => {
  const { id } = DeleteDomainParams.parse(req.params);
  await db.delete(domainsTable).where(eq(domainsTable.id, id));
  res.status(204).send();
});

router.post("/domains/:id/verify", async (req, res) => {
  const { id } = VerifyDomainParams.parse(req.params);
  const [domain] = await db.select().from(domainsTable).where(eq(domainsTable.id, id));

  if (!domain) {
    res.status(404).json({ error: "Domain not found" });
    return;
  }

  let spfVerified = domain.spfVerified;
  let dkimVerified = domain.dkimVerified;
  let status: "pending" | "verified" | "failed" = "pending";

  if (isEmailConfigured()) {
    try {
      const client = getEmailClient();
      const result = await (client as unknown as { getDomainSignatures: (opts: { Count: number; Offset: number }) => Promise<{ DomainSignatures: Array<{ Name: string; SPFVerified: boolean; DKIMVerified: boolean }> }> }).getDomainSignatures({ Count: 100, Offset: 0 });
      const found = result?.DomainSignatures?.find((d) => d.Name === domain.domain);
      if (found) {
        spfVerified = found.SPFVerified ?? false;
        dkimVerified = found.DKIMVerified ?? false;
        status = spfVerified && dkimVerified ? "verified" : "pending";
      } else {
        status = "pending";
      }
    } catch {
      status = "pending";
    }
  } else {
    status = "pending";
  }

  const [updated] = await db.update(domainsTable)
    .set({ spfVerified, dkimVerified, status })
    .where(eq(domainsTable.id, id))
    .returning();

  res.json({ ...updated, createdAt: updated.createdAt.toISOString() });
});

export default router;
