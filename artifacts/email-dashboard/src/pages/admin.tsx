import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  ShieldCheck,
  Zap,
  Webhook,
  MailX,
  Server,
  Check,
  Loader2,
  Database,
  Send,
  Inbox,
  LayoutTemplate,
  Globe,
  Key,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AdminSettings {
  rate_limit_per_minute: string;
  max_recipients_per_email: string;
  webhook_max_retries: string;
  webhook_timeout_seconds: string;
  bounce_auto_suppress_threshold: string;
  inbound_enabled: string;
  sending_enabled: string;
  track_opens: string;
  track_links: string;
}

interface AdminStats {
  emails: number;
  inboundEmails: number;
  templates: number;
  domains: number;
  activeApiKeys: number;
}

function StatCard({ icon: Icon, label, value, color = "text-blue-500" }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-md border p-4">
      <div className={`h-8 w-8 rounded-md flex items-center justify-center bg-muted ${color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-bold">{value.toLocaleString()}</p>
      </div>
    </div>
  );
}

function NumberSetting({
  settingKey,
  label,
  description,
  min,
  max,
  currentValue,
  onSave,
  isPending,
}: {
  settingKey: string;
  label: string;
  description: string;
  min: number;
  max: number;
  currentValue: string;
  onSave: (key: string, value: string) => void;
  isPending: boolean;
}) {
  const [val, setVal] = useState(currentValue);
  const dirty = val !== currentValue;

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Input
          type="number"
          min={min}
          max={max}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          className="w-24 text-center h-8 text-sm"
        />
        {dirty && (
          <Button
            size="sm"
            className="h-8 px-2.5"
            onClick={() => onSave(settingKey, val)}
            disabled={isPending}
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          </Button>
        )}
      </div>
    </div>
  );
}

function ToggleSetting({
  settingKey,
  label,
  description,
  currentValue,
  onSave,
}: {
  settingKey: string;
  label: string;
  description: string;
  currentValue: string;
  onSave: (key: string, value: string) => void;
}) {
  const checked = currentValue === "true";
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <Label className="text-sm font-medium">{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={(v) => onSave(settingKey, String(v))}
      />
    </div>
  );
}

export default function Admin() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: settingsData, isLoading: settingsLoading } = useQuery<{ settings: AdminSettings }>({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const r = await fetch("/api/admin/settings");
      if (!r.ok) throw new Error("Failed to load settings");
      return r.json();
    },
  });

  const { data: statsData, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const r = await fetch("/api/admin/stats");
      if (!r.ok) throw new Error("Failed to load stats");
      return r.json();
    },
  });

  const saveSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const r = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      if (!r.ok) throw new Error("Failed to save");
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
      toast({ title: "Setting saved" });
    },
    onError: () => toast({ title: "Error", description: "Failed to save setting", variant: "destructive" }),
  });

  const s = settingsData?.settings;
  const stats = statsData;

  const handleSave = (key: string, value: string) => saveSetting.mutate({ key, value });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin</h1>
        <p className="text-muted-foreground mt-1">Advanced platform configuration and system overview.</p>
      </div>

      {/* Platform Stats */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Platform Overview</CardTitle>
          </div>
          <CardDescription>Live record counts across all platform data.</CardDescription>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-md" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <StatCard icon={Send} label="Emails Sent" value={stats?.emails ?? 0} color="text-blue-500" />
              <StatCard icon={Inbox} label="Inbound Emails" value={stats?.inboundEmails ?? 0} color="text-purple-500" />
              <StatCard icon={LayoutTemplate} label="Templates" value={stats?.templates ?? 0} color="text-amber-500" />
              <StatCard icon={Globe} label="Domains" value={stats?.domains ?? 0} color="text-green-500" />
              <StatCard icon={Key} label="Active API Keys" value={stats?.activeApiKeys ?? 0} color="text-pink-500" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sending Controls */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Sending Controls</CardTitle>
          </div>
          <CardDescription>Enable or disable core platform functionality globally.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {settingsLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
          ) : (
            <>
              <ToggleSetting
                settingKey="sending_enabled"
                label="Email Sending"
                description="Allow outbound emails to be sent. Disable to queue all emails without sending."
                currentValue={s?.sending_enabled ?? "true"}
                onSave={handleSave}
              />
              <Separator />
              <ToggleSetting
                settingKey="inbound_enabled"
                label="Inbound Processing"
                description="Accept and process incoming emails from the webhook endpoint."
                currentValue={s?.inbound_enabled ?? "true"}
                onSave={handleSave}
              />
              <Separator />
              <ToggleSetting
                settingKey="track_opens"
                label="Track Email Opens"
                description="Enable open tracking pixel in outbound HTML emails by default."
                currentValue={s?.track_opens ?? "true"}
                onSave={handleSave}
              />
              <Separator />
              <ToggleSetting
                settingKey="track_links"
                label="Track Link Clicks"
                description="Enable click tracking for links in outbound emails by default."
                currentValue={s?.track_links ?? "true"}
                onSave={handleSave}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Rate Limiting */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Rate Limits</CardTitle>
          </div>
          <CardDescription>Control throughput and sending limits. Changes take effect immediately.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {settingsLoading ? (
            Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
          ) : (
            <>
              <NumberSetting
                settingKey="rate_limit_per_minute"
                label="API Rate Limit"
                description="Maximum API requests per minute per client."
                min={1}
                max={10000}
                currentValue={s?.rate_limit_per_minute ?? "100"}
                onSave={handleSave}
                isPending={saveSetting.isPending}
              />
              <Separator />
              <NumberSetting
                settingKey="max_recipients_per_email"
                label="Max Recipients Per Email"
                description="Maximum number of recipients allowed in a single send request."
                min={1}
                max={1000}
                currentValue={s?.max_recipients_per_email ?? "50"}
                onSave={handleSave}
                isPending={saveSetting.isPending}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Webhook Policy */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Webhook className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Webhook Retry Policy</CardTitle>
          </div>
          <CardDescription>Configure how the platform retries failed inbound webhook deliveries.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {settingsLoading ? (
            Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
          ) : (
            <>
              <NumberSetting
                settingKey="webhook_max_retries"
                label="Max Retries"
                description="Number of times to retry a failed webhook delivery before giving up."
                min={0}
                max={10}
                currentValue={s?.webhook_max_retries ?? "3"}
                onSave={handleSave}
                isPending={saveSetting.isPending}
              />
              <Separator />
              <NumberSetting
                settingKey="webhook_timeout_seconds"
                label="Request Timeout (seconds)"
                description="How long to wait for a webhook response before treating it as failed."
                min={5}
                max={120}
                currentValue={s?.webhook_timeout_seconds ?? "30"}
                onSave={handleSave}
                isPending={saveSetting.isPending}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Bounce Handling */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <MailX className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Bounce Handling</CardTitle>
          </div>
          <CardDescription>Automatic suppression based on bounce behavior.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {settingsLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <NumberSetting
              settingKey="bounce_auto_suppress_threshold"
              label="Auto-Suppress After N Bounces"
              description="Automatically add an address to the suppression list after this many hard bounces."
              min={1}
              max={20}
              currentValue={s?.bounce_auto_suppress_threshold ?? "5"}
              onSave={handleSave}
              isPending={saveSetting.isPending}
            />
          )}
          <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
            Hard bounces are suppressed immediately on the first occurrence. This threshold applies to soft bounces and repeated delivery failures.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
