import { Router } from "express";

const router = Router();

router.get("/settings", (req, res) => {
  const token = process.env.ORAMAIL_API_TOKEN ?? "";
  const tokenConfigured = token.length > 0;
  const tokenMasked = tokenConfigured
    ? token.slice(0, 8) + "••••••••••••••••••••••••"
    : null;

  res.json({
    smtp: {
      host: "smtp.postmarkapp.com",
      port: 587,
      tls: true,
      username: tokenConfigured ? tokenMasked : null,
      password: tokenConfigured ? tokenMasked : null,
      note: "Use your OraMAIL API token as both SMTP username and password.",
    },
    inbound: {
      webhookPath: "/api/inbound/webhook",
      note: "Configure this URL in OraMAIL → Inbound Stream → Webhook URL.",
    },
    server: {
      tokenConfigured,
    },
  });
});

export default router;
