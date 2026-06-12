import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Key,
  Plus,
  Copy,
  Check,
  Trash2,
  ShieldOff,
  Globe,
  Code2,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";

interface ApiKey {
  id: number;
  name: string;
  keyPrefix: string;
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
}

interface NewKeyResult extends ApiKey {
  key: string;
}

function CopyButton({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="ghost"
      size={label ? "sm" : "icon"}
      className={`shrink-0 text-muted-foreground hover:text-foreground ${label ? "gap-1.5" : "h-7 w-7"}`}
      onClick={() => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
      {label && (copied ? "Copied" : label)}
    </Button>
  );
}

function NewKeyDialog({ open, onClose, newKey }: { open: boolean; onClose: () => void; newKey: NewKeyResult | null }) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (newKey) {
      navigator.clipboard.writeText(newKey.key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            API Key Created
          </DialogTitle>
          <DialogDescription>
            Copy this key now. For security, it won't be shown again.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="rounded-md border bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground mb-1.5">Key Name</p>
            <p className="font-medium text-sm">{newKey?.name}</p>
          </div>
          <div className="rounded-md border bg-muted/40 p-3 space-y-2">
            <p className="text-xs text-muted-foreground mb-1.5">Secret Key — copy and store securely</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs font-mono break-all select-all">
                {visible ? newKey?.key : "ora_" + "•".repeat(44)}
              </code>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setVisible(!visible)}>
                {visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>
          <div className="flex items-start gap-2 rounded-md border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-400">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            This key will only be shown once. Store it in a secure location such as an environment variable.
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={handleCopy}>
            {copied ? <Check className="h-4 w-4 mr-2 text-green-500" /> : <Copy className="h-4 w-4 mr-2" />}
            {copied ? "Copied!" : "Copy Key"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const BASE_URL = `${window.location.origin}/api`;

const ENDPOINT_DOCS = [
  { method: "GET",    path: "/api/emails",             description: "List sent emails with filtering" },
  { method: "POST",   path: "/api/emails",             description: "Send a new email" },
  { method: "GET",    path: "/api/emails/:id",         description: "Get email detail" },
  { method: "GET",    path: "/api/inbound",            description: "List received emails" },
  { method: "POST",   path: "/api/inbound/webhook",    description: "Inbound webhook (OraMAIL)" },
  { method: "GET",    path: "/api/templates",          description: "List templates" },
  { method: "POST",   path: "/api/templates",          description: "Create template" },
  { method: "PUT",    path: "/api/templates/:id",      description: "Update template" },
  { method: "DELETE", path: "/api/templates/:id",      description: "Delete template" },
  { method: "GET",    path: "/api/domains",            description: "List sender domains" },
  { method: "POST",   path: "/api/domains",            description: "Add domain" },
  { method: "POST",   path: "/api/domains/:id/verify", description: "Trigger domain verification" },
  { method: "GET",    path: "/api/suppressions",       description: "List suppressions" },
  { method: "POST",   path: "/api/suppressions",       description: "Add suppression" },
  { method: "DELETE", path: "/api/suppressions/:id",   description: "Remove suppression" },
  { method: "GET",    path: "/api/stats/overview",     description: "Delivery stats overview" },
  { method: "GET",    path: "/api/stats/delivery",     description: "30-day delivery trend" },
  { method: "GET",    path: "/api/stats/bounces",      description: "Bounce breakdown" },
  { method: "GET",    path: "/api/activity",           description: "Recent activity feed" },
  { method: "GET",    path: "/api/api-keys",           description: "List API keys" },
  { method: "POST",   path: "/api/api-keys",           description: "Create API key" },
  { method: "DELETE", path: "/api/api-keys/:id",       description: "Delete API key" },
];

const METHOD_COLORS: Record<string, string> = {
  GET:    "bg-blue-500/10 text-blue-600 border-blue-500/20",
  POST:   "bg-green-500/10 text-green-600 border-green-500/20",
  PUT:    "bg-amber-500/10 text-amber-600 border-amber-500/20",
  PATCH:  "bg-orange-500/10 text-orange-600 border-orange-500/20",
  DELETE: "bg-red-500/10 text-red-600 border-red-500/20",
};

export default function ApiSettings() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyResult, setNewKeyResult] = useState<NewKeyResult | null>(null);
  const [showNewKey, setShowNewKey] = useState(false);

  const { data, isLoading } = useQuery<{ keys: ApiKey[] }>({
    queryKey: ["api-keys"],
    queryFn: async () => {
      const r = await fetch("/api/api-keys");
      if (!r.ok) throw new Error("Failed to load API keys");
      return r.json();
    },
  });

  const createKey = useMutation({
    mutationFn: async (name: string) => {
      const r = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!r.ok) throw new Error("Failed to create key");
      return r.json() as Promise<NewKeyResult>;
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["api-keys"] });
      setNewKeyResult(result);
      setShowNewKey(true);
      setCreateOpen(false);
      setNewKeyName("");
    },
    onError: () => toast({ title: "Error", description: "Failed to create API key", variant: "destructive" }),
  });

  const deleteKey = useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`/api/api-keys/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error("Failed to delete key");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["api-keys"] });
      toast({ title: "Key Deleted" });
    },
  });

  const revokeKey = useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`/api/api-keys/${id}/revoke`, { method: "PATCH" });
      if (!r.ok) throw new Error("Failed to revoke key");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["api-keys"] });
      toast({ title: "Key Revoked" });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">API</h1>
        <p className="text-muted-foreground mt-1">Manage API keys and explore available endpoints.</p>
      </div>

      {/* Base URL */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Base URL</CardTitle>
          </div>
          <CardDescription>All API requests should be made to this base URL.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2.5">
            <code className="flex-1 text-sm font-mono break-all">{BASE_URL}</code>
            <CopyButton value={BASE_URL} />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Send requests with <code className="font-mono text-xs">Content-Type: application/json</code>. Authentication via API key header: <code className="font-mono text-xs">X-API-Key: ora_...</code>
          </p>
        </CardContent>
      </Card>

      {/* API Keys */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">API Keys</CardTitle>
            </div>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" /> New Key
            </Button>
          </div>
          <CardDescription>Keys grant programmatic access to the Oramail API. Keep them secret.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Key Prefix</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : data?.keys.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    <Key className="h-6 w-6 mx-auto mb-2 opacity-30" />
                    No API keys yet. Create one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                data?.keys.map((k) => (
                  <TableRow key={k.id} className={!k.isActive ? "opacity-50" : ""}>
                    <TableCell className="font-medium">{k.name}</TableCell>
                    <TableCell>
                      <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{k.keyPrefix}••••••••</code>
                    </TableCell>
                    <TableCell>
                      {k.isActive ? (
                        <Badge variant="outline" className="border-green-500/30 text-green-600 bg-green-500/10 text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          Revoked
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {k.lastUsedAt ? format(parseISO(k.lastUsedAt), "MMM d, yyyy") : "Never"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(parseISO(k.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {k.isActive && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-amber-600"
                            title="Revoke key"
                            onClick={() => revokeKey.mutate(k.id)}
                          >
                            <ShieldOff className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          title="Delete key"
                          onClick={() => {
                            if (confirm(`Delete API key "${k.name}"?`)) deleteKey.mutate(k.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Endpoints */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">API Endpoints</CardTitle>
          </div>
          <CardDescription>All available REST endpoints. Responses are JSON.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Method</TableHead>
                <TableHead>Path</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {ENDPOINT_DOCS.map((ep) => (
                <TableRow key={`${ep.method}-${ep.path}`}>
                  <TableCell>
                    <Badge variant="outline" className={`font-mono text-xs ${METHOD_COLORS[ep.method]}`}>
                      {ep.method}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs font-mono">{ep.path}</code>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{ep.description}</TableCell>
                  <TableCell>
                    <CopyButton value={`${BASE_URL}${ep.path}`} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create key dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription>Give this key a name that describes its purpose (e.g. "Production Server", "CI Pipeline").</DialogDescription>
          </DialogHeader>
          <div className="py-3">
            <Input
              placeholder="Key name..."
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && newKeyName.trim() && createKey.mutate(newKeyName.trim())}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              onClick={() => createKey.mutate(newKeyName.trim())}
              disabled={!newKeyName.trim() || createKey.isPending}
            >
              <Key className="h-4 w-4 mr-1.5" /> Create Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New key reveal dialog */}
      <NewKeyDialog
        open={showNewKey}
        onClose={() => { setShowNewKey(false); setNewKeyResult(null); }}
        newKey={newKeyResult}
      />
    </div>
  );
}
