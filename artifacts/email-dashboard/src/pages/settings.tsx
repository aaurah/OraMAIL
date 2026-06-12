import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Settings2,
  Server,
  Webhook,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  Mail,
  Lock,
  Globe,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SettingsData {
  smtp: {
    host: string;
    port: number;
    tls: boolean;
    username: string | null;
    password: string | null;
    note: string;
  };
  inbound: {
    webhookPath: string;
    note: string;
  };
  server: {
    postmarkTokenConfigured: boolean;
  };
}

function CopyField({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      toast({ title: "Copied!", description: `${label} copied to clipboard.` });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border bg-muted/40 px-3 py-2">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className={`text-sm truncate ${mono ? "font-mono" : "font-medium"}`}>{value}</p>
      </div>
      <Button variant="ghost" size="icon" className="shrink-0 h-7 w-7 text-muted-foreground hover:text-foreground" onClick={handleCopy}>
        {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
      </Button>
    </div>
  );
}

export default function Settings() {
  const { data, isLoading } = useQuery<SettingsData>({
    queryKey: ["settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error("Failed to load settings");
      return res.json();
    },
  });

  const webhookUrl = data
    ? `${window.location.origin}${data.inbound.webhookPath}`
    : "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Configuration, credentials, and integration details.</p>
      </div>

      {/* Server Status */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Server Status</CardTitle>
          </div>
          <CardDescription>Postmark API connection status.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <div className="flex items-center justify-between rounded-md border px-4 py-3">
              <div className="flex items-center gap-3">
                <div className={`h-2 w-2 rounded-full ${data?.server.postmarkTokenConfigured ? "bg-green-500" : "bg-amber-500"}`} />
                <div>
                  <p className="text-sm font-medium">Postmark Server Token</p>
                  <p className="text-xs text-muted-foreground">
                    {data?.server.postmarkTokenConfigured
                      ? "Connected — emails will be sent via Postmark"
                      : "Not configured — emails are queued but not sent"}
                  </p>
                </div>
              </div>
              {data?.server.postmarkTokenConfigured ? (
                <Badge variant="outline" className="border-green-500/30 text-green-600 bg-green-500/10">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Active
                </Badge>
              ) : (
                <Badge variant="outline" className="border-amber-500/30 text-amber-600 bg-amber-500/10">
                  <AlertCircle className="h-3 w-3 mr-1" /> Not Set
                </Badge>
              )}
            </div>
          )}
          {!isLoading && !data?.server.postmarkTokenConfigured && (
            <div className="rounded-md border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
              Add your <span className="font-mono font-semibold">POSTMARK_SERVER_TOKEN</span> secret to enable live email sending. Get it from your Postmark dashboard → Server → API Tokens.
            </div>
          )}
        </CardContent>
      </Card>

      {/* SMTP Settings */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">SMTP Settings</CardTitle>
          </div>
          <CardDescription>
            Use these credentials to send email via SMTP from your application or email client.
            Your Postmark Server Token is used as both the SMTP username and password.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
          ) : (
            <>
              <CopyField label="SMTP Host" value={data?.smtp.host ?? "smtp.postmarkapp.com"} />
              <CopyField label="SMTP Port (TLS/STARTTLS)" value={String(data?.smtp.port ?? 587)} />
              <CopyField label="Encryption" value="STARTTLS" mono={false} />
              {data?.smtp.username ? (
                <>
                  <CopyField label="SMTP Username (Server Token)" value={data.smtp.username} />
                  <CopyField label="SMTP Password (Server Token)" value={data.smtp.password!} />
                </>
              ) : (
                <div className="flex items-center gap-2 rounded-md border border-dashed px-3 py-3 text-sm text-muted-foreground">
                  <Lock className="h-4 w-4 shrink-0" />
                  SMTP credentials will appear here once your Postmark Server Token is configured.
                </div>
              )}
              <Separator />
              <p className="text-xs text-muted-foreground">{data?.smtp.note}</p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Inbound Webhook */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Webhook className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Inbound Webhook</CardTitle>
          </div>
          <CardDescription>
            Configure this URL in Postmark to receive inbound emails into your dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <Skeleton className="h-12 w-full" />
          ) : (
            <CopyField label="Inbound Webhook URL" value={webhookUrl} />
          )}
          <div className="rounded-md border bg-muted/30 p-4 space-y-3 text-sm">
            <p className="font-medium flex items-center gap-2"><Settings2 className="h-4 w-4" /> Setup Instructions</p>
            <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground ml-1">
              <li>Log in to your Postmark account and open your Server.</li>
              <li>Go to <span className="font-medium text-foreground">Message Streams → Inbound</span>.</li>
              <li>Paste the webhook URL above into the <span className="font-medium text-foreground">Webhook URL</span> field.</li>
              <li>Save. Postmark will forward all received emails to this endpoint.</li>
            </ol>
          </div>
          <p className="text-xs text-muted-foreground">{data?.inbound.note}</p>
        </CardContent>
      </Card>

      {/* DNS Quick Reference */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">DNS Quick Reference</CardTitle>
          </div>
          <CardDescription>
            Required DNS records for sending and receiving email. Configure these at your DNS provider.
            See the <strong>Domains</strong> page for per-domain SPF/DKIM verification status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            {[
              { type: "TXT", name: "@", value: "v=spf1 include:spf.mtasv.net ~all", purpose: "SPF — authorize Postmark to send from your domain" },
              { type: "TXT", name: "pm._domainkey", value: "<DKIM key from Postmark dashboard>", purpose: "DKIM — domain key signing (get value from Postmark)" },
              { type: "CNAME", name: "pm-bounces", value: "pm.mtasv.net", purpose: "Return-Path — bounce tracking" },
              { type: "TXT", name: "_dmarc", value: "v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com", purpose: "DMARC — email authentication policy" },
              { type: "MX", name: "inbound", value: "inbound.postmarkapp.com (priority 10)", purpose: "Inbound MX — receive emails via Postmark" },
            ].map((record) => (
              <div key={record.name} className="rounded-md border p-3 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs font-mono">{record.type}</Badge>
                  <span className="font-mono text-xs text-muted-foreground">{record.name}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{record.purpose}</span>
                </div>
                <div className="flex items-center justify-between gap-2 bg-muted/40 rounded px-2 py-1.5">
                  <code className="text-xs font-mono break-all">{record.value}</code>
                  {!record.value.includes("<") && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 h-6 w-6 text-muted-foreground hover:text-foreground"
                      onClick={() => navigator.clipboard.writeText(record.value)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
