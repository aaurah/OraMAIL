import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Settings2, Server, Webhook, Copy, Check, CheckCircle2,
  XCircle, Mail, Lock, Globe, AlertCircle, Wifi, WifiOff, Loader2, Save,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SettingsData {
  smtp: {
    host: string; port: number; secure: boolean;
    username: string | null; password: string | null;
    fromName: string; fromEmail: string; note: string;
  };
  inbound: { webhookPath: string; note: string };
  server: {
    tokenConfigured: boolean; smtpHost: string; smtpPort: number;
    smtpSecure: boolean; smtpFromName: string; smtpFromEmail: string;
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

async function patchAdminSetting(key: string, value: string) {
  const res = await fetch("/api/admin/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, value }),
  });
  if (!res.ok) throw new Error("Failed to save");
  return res.json();
}

async function testSmtp(): Promise<{ success: boolean; error?: string }> {
  const res = await fetch("/api/admin/test-smtp", { method: "POST" });
  return res.json();
}

function SmtpConfigForm({ initial }: { initial: SettingsData["server"] }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [host, setHost] = useState(initial.smtpHost);
  const [port, setPort] = useState(String(initial.smtpPort));
  const [secure, setSecure] = useState(initial.smtpSecure);
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [fromName, setFromName] = useState(initial.smtpFromName);
  const [fromEmail, setFromEmail] = useState(initial.smtpFromEmail);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);

  useEffect(() => {
    setHost(initial.smtpHost);
    setPort(String(initial.smtpPort));
    setSecure(initial.smtpSecure);
    setFromName(initial.smtpFromName);
    setFromEmail(initial.smtpFromEmail);
  }, [initial]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates: Array<[string, string]> = [
        ["smtp_host", host],
        ["smtp_port", port],
        ["smtp_secure", String(secure)],
        ["smtp_from_name", fromName],
        ["smtp_from_email", fromEmail],
      ];
      if (user) updates.push(["smtp_user", user]);
      if (pass) updates.push(["smtp_pass", pass]);
      await Promise.all(updates.map(([k, v]) => patchAdminSetting(k, v)));
      toast({ title: "SMTP settings saved" });
      qc.invalidateQueries({ queryKey: ["settings"] });
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testSmtp();
      setTestResult(result);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>SMTP Host</Label>
          <Input value={host} onChange={e => setHost(e.target.value)} placeholder="smtp.example.com" />
        </div>
        <div className="space-y-1.5">
          <Label>Port</Label>
          <Input value={port} onChange={e => setPort(e.target.value)} placeholder="587" type="number" />
        </div>
        <div className="space-y-1.5">
          <Label>Username</Label>
          <Input value={user} onChange={e => setUser(e.target.value)} placeholder="Leave blank to keep current" />
        </div>
        <div className="space-y-1.5">
          <Label>Password</Label>
          <Input value={pass} onChange={e => setPass(e.target.value)} type="password" placeholder="Leave blank to keep current" />
        </div>
        <div className="space-y-1.5">
          <Label>Default From Name</Label>
          <Input value={fromName} onChange={e => setFromName(e.target.value)} placeholder="OraMAIL" />
        </div>
        <div className="space-y-1.5">
          <Label>Default From Email</Label>
          <Input value={fromEmail} onChange={e => setFromEmail(e.target.value)} placeholder="noreply@yourdomain.com" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Switch checked={secure} onCheckedChange={setSecure} id="smtp-secure" />
        <Label htmlFor="smtp-secure" className="cursor-pointer">
          Use SSL/TLS <span className="text-muted-foreground font-normal">(disable for STARTTLS on port 587)</span>
        </Label>
      </div>

      {testResult && (
        <div className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${testResult.success ? "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400" : "border-destructive/30 bg-destructive/10 text-destructive"}`}>
          {testResult.success
            ? <><CheckCircle2 className="h-4 w-4" /> Connection successful — SMTP is working.</>
            : <><XCircle className="h-4 w-4" /> {testResult.error || "Connection failed"}</>}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Settings
        </Button>
        <Button variant="outline" onClick={handleTest} disabled={testing}>
          {testing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : (testResult?.success ? <Wifi className="h-4 w-4 mr-2 text-green-500" /> : <WifiOff className="h-4 w-4 mr-2" />)}
          Test Connection
        </Button>
      </div>
    </div>
  );
}

export default function Settings() {
  const { data, isLoading } = useQuery<SettingsData>({
    queryKey: ["settings"],
    queryFn: () => fetch("/api/settings").then(r => r.json()),
  });

  const webhookUrl = data ? `${window.location.origin}${data.inbound.webhookPath}` : "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">SMTP configuration, credentials, and integration details.</p>
      </div>

      {/* SMTP Configuration */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">SMTP Configuration</CardTitle>
          </div>
          <CardDescription>
            Configure your SMTP provider. Works with any SMTP service — Gmail, SendGrid, Mailgun, AWS SES, or your own server.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
            </div>
          ) : data ? (
            <>
              <div className="flex items-center gap-3 mb-5 p-3 rounded-md border">
                <div className={`h-2 w-2 rounded-full ${data.server.tokenConfigured ? "bg-green-500" : "bg-amber-500"}`} />
                <p className="text-sm font-medium flex-1">
                  {data.server.tokenConfigured
                    ? `Connected via ${data.server.smtpHost}`
                    : "Not configured — emails will be queued but not sent"}
                </p>
                {data.server.tokenConfigured
                  ? <Badge variant="outline" className="border-green-500/30 text-green-600 bg-green-500/10"><CheckCircle2 className="h-3 w-3 mr-1" /> Active</Badge>
                  : <Badge variant="outline" className="border-amber-500/30 text-amber-600 bg-amber-500/10"><AlertCircle className="h-3 w-3 mr-1" /> Not Set</Badge>}
              </div>
              <SmtpConfigForm initial={data.server} />
            </>
          ) : null}
        </CardContent>
      </Card>

      {/* SMTP Credentials Display */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">SMTP Connection Details</CardTitle>
          </div>
          <CardDescription>
            Use these credentials to send email via SMTP from your application or email client.
            Your OraMAIL API token is used as both the SMTP username and password.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
          ) : (
            <>
              <CopyField label="SMTP Host" value={data?.smtp.host ?? ""} />
              <CopyField label="SMTP Port" value={String(data?.smtp.port ?? 587)} />
              <CopyField label="Encryption" value={(data?.smtp.secure ? "SSL/TLS" : "STARTTLS")} mono={false} />
              {data?.smtp.username ? (
                <>
                  <CopyField label="SMTP Username" value={data.smtp.username} />
                  <CopyField label="SMTP Password" value={data.smtp.password!} />
                </>
              ) : (
                <div className="flex items-center gap-2 rounded-md border border-dashed px-3 py-3 text-sm text-muted-foreground">
                  <Lock className="h-4 w-4 shrink-0" />
                  SMTP credentials will appear here once your API token is configured above.
                </div>
              )}
              {data?.smtp.fromName && <CopyField label="Default From Name" value={data.smtp.fromName} mono={false} />}
              {data?.smtp.fromEmail && <CopyField label="Default From Email" value={data.smtp.fromEmail} />}
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
          <CardDescription>Configure this URL in OraMAIL to receive inbound emails into your dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? <Skeleton className="h-12 w-full" /> : <CopyField label="Inbound Webhook URL" value={webhookUrl} />}
          <div className="rounded-md border bg-muted/30 p-4 space-y-3 text-sm">
            <p className="font-medium flex items-center gap-2"><Settings2 className="h-4 w-4" /> Setup Instructions</p>
            <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground ml-1">
              <li>Log in to your OraMAIL account and open your Server.</li>
              <li>Go to <span className="font-medium text-foreground">Message Streams → Inbound</span>.</li>
              <li>Paste the webhook URL above into the <span className="font-medium text-foreground">Webhook URL</span> field.</li>
              <li>Save. OraMAIL will forward all received emails to this endpoint.</li>
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
            Required DNS records for sending and receiving email. See the <strong>Domains</strong> page for per-domain SPF/DKIM verification.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            {[
              { type: "TXT", name: "@", value: "v=spf1 include:spf.mtasv.net ~all", purpose: "SPF — authorize OraMAIL to send from your domain" },
              { type: "TXT", name: "pm._domainkey", value: "<DKIM key from OraMAIL dashboard>", purpose: "DKIM — domain key signing (get value from OraMAIL)" },
              { type: "CNAME", name: "pm-bounces", value: "pm.mtasv.net", purpose: "Return-Path — bounce tracking" },
              { type: "TXT", name: "_dmarc", value: "v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com", purpose: "DMARC — email authentication policy" },
              { type: "MX", name: "inbound", value: "inbound.postmarkapp.com (priority 10)", purpose: "Inbound MX — receive emails via OraMAIL" },
            ].map((record) => (
              <div key={record.name} className="rounded-md border p-3 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs font-mono">{record.type}</Badge>
                  <span className="font-mono text-xs text-muted-foreground">{record.name}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{record.purpose}</span>
                </div>
                <div className="flex items-center justify-between gap-2 bg-muted/40 rounded px-2 py-1.5">
                  <code className="text-xs font-mono break-all">{record.value}</code>
                  {!record.value.includes("<") && (
                    <Button variant="ghost" size="icon" className="shrink-0 h-6 w-6 text-muted-foreground hover:text-foreground"
                      onClick={() => navigator.clipboard.writeText(record.value)}>
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
