import { Router } from "express";

const router = Router();

router.get("/settings", (req, res) => {
  const token = process.env.POSTMARK_SERVER_TOKEN ?? "";
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
      note: "Use your Postmark Server Token as both SMTP username and password.",
    },
    inbound: {
      webhookPath: "/api/inbound/webhook",
      note: "Configure this URL in Postmark → Server → Inbound Stream → Webhook URL.",
    },
    server: {
      postmarkTokenConfigured: tokenConfigured,
    },
  });
});

export default router;
