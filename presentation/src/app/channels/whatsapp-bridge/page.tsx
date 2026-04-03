"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { bridgeApi, BridgeConfig, BridgeStatus } from "@/lib/bridgeApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

const inputClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";
const textareaClass =
  "min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export default function WhatsAppBridgePage() {
  const [config, setConfig] = useState<BridgeConfig | null>(null);
  const [status, setStatus] = useState<BridgeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [testNumber, setTestNumber] = useState("");
  const [testText, setTestText] = useState("Hello from the WhatsApp bridge");
  const [parlantText, setParlantText] = useState("Ping Parlant");
  const [resetNumber, setResetNumber] = useState("");

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextConfig, nextStatus] = await Promise.all([
        bridgeApi.getConfig(),
        bridgeApi.getStatus()
      ]);
      setConfig(nextConfig);
      setStatus(nextStatus);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const updateConfig = (updater: (prev: BridgeConfig) => BridgeConfig) => {
    setConfig((prev) => (prev ? updater(prev) : prev));
  };

  const onSave = async () => {
    if (!config) {
      return;
    }
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const nextConfig = await bridgeApi.updateConfig(config);
      setConfig(nextConfig);
      setNotice("Config saved.");
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  };

  const onTestParlant = async () => {
    setError(null);
    setNotice(null);
    try {
      const result = await bridgeApi.testParlant(parlantText);
      setNotice(`Parlant ok: ${result.responseText ?? ""}`);
    } catch (err) {
      setError(String(err));
    }
  };

  const onTestSend = async () => {
    setError(null);
    setNotice(null);
    try {
      await bridgeApi.testSend({ toNumber: testNumber, text: testText });
      setNotice("Test message sent.");
    } catch (err) {
      setError(String(err));
    }
  };

  const onResetSession = async () => {
    setError(null);
    setNotice(null);
    if (!resetNumber.trim()) {
      setError("Enter a number to reset the session.");
      return;
    }
    try {
      const result = await bridgeApi.resetSession({ customerNumber: resetNumber });
      setNotice(
        result.removed > 0
          ? "Session reset. Next message will start a new conversation."
          : "No existing session found for that number."
      );
    } catch (err) {
      setError(String(err));
    }
  };

  const lastWebhook = status?.lastWebhookAt
    ? new Date(status.lastWebhookAt).toLocaleString()
    : "No webhook yet";
  const lastSend = status?.lastSendStatus
    ? `${status.lastSendStatus.ok ? "OK" : "Failed"} · ${new Date(
        status.lastSendStatus.at
      ).toLocaleString()}`
    : "No outbound sends yet";

  const canSave = useMemo(() => Boolean(config && !saving), [config, saving]);

  return (
    <div className="min-h-screen bg-transparent px-6 pb-16 pt-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6" id="content">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <Link
              href="/"
              className="text-xs uppercase tracking-[0.2em] text-muted-foreground"
            >
              Back to Overview
            </Link>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Channels → WhatsApp Bridge
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Connect a Parlant agent to your WhatsApp business number. Configure
              filters, verify webhooks, and run live tests without touching JSON.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" onClick={reload}>
              Refresh
            </Button>
            <Button type="button" onClick={onSave} disabled={!canSave}>
              {saving ? "Saving..." : "Save Config"}
            </Button>
          </div>
        </header>

        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary">Bridge API: http://localhost:8083</Badge>
          <Badge variant="outline">Last webhook: {lastWebhook}</Badge>
          <Badge variant="outline">Last send: {lastSend}</Badge>
        </div>

        {loading && (
          <Card className="p-6 text-sm text-muted-foreground">Loading...</Card>
        )}
        {!loading && error && (
          <Card className="border-destructive/60 bg-destructive/10 p-6 text-sm text-destructive">
            {error}
          </Card>
        )}
        {!loading && notice && (
          <Card className="border-primary/40 bg-primary/10 p-6 text-sm text-primary">
            {notice}
          </Card>
        )}

        {!loading && config && (
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="flex flex-col gap-6">
              <Card className="space-y-6 p-6">
                <SectionTitle title="Parlant" subtitle="Where to send messages." />
                <Field label="Base URL">
                  <input
                    className={inputClass}
                    value={config.parlant.baseUrl}
                    onChange={(event) =>
                      updateConfig((prev) => ({
                        ...prev,
                        parlant: { ...prev.parlant, baseUrl: event.target.value }
                      }))
                    }
                  />
                </Field>
                <Field label="Agent ID">
                  <input
                    className={inputClass}
                    value={config.parlant.agentId}
                    onChange={(event) =>
                      updateConfig((prev) => ({
                        ...prev,
                        parlant: { ...prev.parlant, agentId: event.target.value }
                      }))
                    }
                  />
                </Field>
                <Field label="API Key (optional)">
                  <input
                    className={inputClass}
                    type="password"
                    value={config.parlant.apiKey ?? ""}
                    onChange={(event) =>
                      updateConfig((prev) => ({
                        ...prev,
                        parlant: {
                          ...prev.parlant,
                          apiKey: event.target.value || null
                        }
                      }))
                    }
                  />
                </Field>
                <Field label="Session TTL (hours)">
                  <input
                    className={inputClass}
                    type="number"
                    min={1}
                    max={168}
                    value={config.session.ttlHours}
                    onChange={(event) =>
                      updateConfig((prev) => ({
                        ...prev,
                        session: {
                          ...prev.session,
                          ttlHours: Number(event.target.value)
                        }
                      }))
                    }
                  />
                </Field>
              </Card>

              <Card className="space-y-6 p-6">
                <SectionTitle
                  title="Webhook Filters"
                  subtitle="Filter inbound messages by MyOperator phone_number_id."
                />
                <MultiValueInput
                  label="Allowed phone_number_id"
                  items={config.webhook.allowedPhoneNumberIds}
                  placeholder="106540352242922"
                  onChange={(items) =>
                    updateConfig((prev) => ({
                      ...prev,
                      webhook: { ...prev.webhook, allowedPhoneNumberIds: items }
                    }))
                  }
                />
                <Separator />
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">Signature verification</p>
                    <p className="text-xs text-muted-foreground">
                      Validate X-Hub-Signature-256 using HMAC SHA256.
                    </p>
                  </div>
                  <Switch
                    checked={config.webhook.verify.enabled}
                    onCheckedChange={(value) =>
                      updateConfig((prev) => ({
                        ...prev,
                        webhook: {
                          ...prev.webhook,
                          verify: { ...prev.webhook.verify, enabled: value }
                        }
                      }))
                    }
                  />
                </div>
                <Field label="Signature header name">
                  <input
                    className={inputClass}
                    value={config.webhook.verify.headerName}
                    onChange={(event) =>
                      updateConfig((prev) => ({
                        ...prev,
                        webhook: {
                          ...prev.webhook,
                          verify: {
                            ...prev.webhook.verify,
                            headerName: event.target.value
                          }
                        }
                      }))
                    }
                  />
                </Field>
                <Field label="Webhook secret">
                  <input
                    className={inputClass}
                    type="password"
                    value={config.webhook.verify.secret}
                    onChange={(event) =>
                      updateConfig((prev) => ({
                        ...prev,
                        webhook: {
                          ...prev.webhook,
                          verify: {
                            ...prev.webhook.verify,
                            secret: event.target.value
                          }
                        }
                      }))
                    }
                  />
                </Field>
              </Card>
            </div>

            <div className="flex flex-col gap-6">
              <Card className="space-y-6 p-6">
                <SectionTitle
                  title="MyOperator Send API"
                  subtitle="Where outbound WhatsApp replies go."
                />
                <Field label="Send API URL">
                  <input
                    className={inputClass}
                    value={config.myoperator.sendApi.url}
                    onChange={(event) =>
                      updateConfig((prev) => ({
                        ...prev,
                        myoperator: {
                          sendApi: {
                            ...prev.myoperator.sendApi,
                            url: event.target.value
                          }
                        }
                      }))
                    }
                  />
                </Field>
                <Field label="API Key">
                  <input
                    className={inputClass}
                    type="password"
                    value={config.myoperator.sendApi.apiKey}
                    onChange={(event) =>
                      updateConfig((prev) => ({
                        ...prev,
                        myoperator: {
                          sendApi: {
                            ...prev.myoperator.sendApi,
                            apiKey: event.target.value
                          }
                        }
                      }))
                    }
                  />
                </Field>
                <Field label="Company ID">
                  <input
                    className={inputClass}
                    value={config.myoperator.sendApi.companyId}
                    onChange={(event) =>
                      updateConfig((prev) => ({
                        ...prev,
                        myoperator: {
                          sendApi: {
                            ...prev.myoperator.sendApi,
                            companyId: event.target.value
                          }
                        }
                      }))
                    }
                  />
                </Field>
                <Field label="Default MyOperator phone_number_id">
                  <input
                    className={inputClass}
                    value={config.myoperator.sendApi.defaultMyopPhoneNumberId}
                    onChange={(event) =>
                      updateConfig((prev) => ({
                        ...prev,
                        myoperator: {
                          sendApi: {
                            ...prev.myoperator.sendApi,
                            defaultMyopPhoneNumberId: event.target.value
                          }
                        }
                      }))
                    }
                  />
                </Field>
                <Field label="Default country code">
                  <input
                    className={inputClass}
                    value={config.myoperator.sendApi.defaultCountryCode}
                    onChange={(event) =>
                      updateConfig((prev) => ({
                        ...prev,
                        myoperator: {
                          sendApi: {
                            ...prev.myoperator.sendApi,
                            defaultCountryCode: event.target.value
                          }
                        }
                      }))
                    }
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                      Customer number format
                    </label>
                    <select
                      className={inputClass}
                      value={config.myoperator.sendApi.customerNumberFormat}
                      onChange={(event) =>
                        updateConfig((prev) => ({
                          ...prev,
                          myoperator: {
                            sendApi: {
                              ...prev.myoperator.sendApi,
                              customerNumberFormat: event.target
                                .value as "E164" | "NATIONAL"
                            }
                          }
                        }))
                      }
                    >
                      <option value="E164">E164</option>
                      <option value="NATIONAL">NATIONAL</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-md border border-border/60 bg-background px-3 py-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        Preview URL
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Expand links in WhatsApp.
                      </p>
                    </div>
                    <Switch
                      checked={config.myoperator.sendApi.previewUrl}
                      onCheckedChange={(value) =>
                        updateConfig((prev) => ({
                          ...prev,
                          myoperator: {
                            sendApi: {
                              ...prev.myoperator.sendApi,
                              previewUrl: value
                            }
                          }
                        }))
                      }
                    />
                  </div>
                </div>
              </Card>

              <Card className="space-y-6 p-6">
                <SectionTitle
                  title="Live Tests"
                  subtitle="Verify Parlant and MyOperator without waiting for a webhook."
                />
                <Field label="Parlant test prompt">
                  <textarea
                    className={textareaClass}
                    value={parlantText}
                    onChange={(event) => setParlantText(event.target.value)}
                  />
                  <Button type="button" variant="outline" onClick={onTestParlant}>
                    Test Parlant
                  </Button>
                </Field>
                <Separator />
                <Field label="Test WhatsApp number">
                  <input
                    className={inputClass}
                    value={testNumber}
                    placeholder="16505551234"
                    onChange={(event) => setTestNumber(event.target.value)}
                  />
                </Field>
                <Field label="Test message">
                  <textarea
                    className={textareaClass}
                    value={testText}
                    onChange={(event) => setTestText(event.target.value)}
                  />
                </Field>
                <Button type="button" onClick={onTestSend}>
                  Send Test Message
                </Button>
              </Card>

              <Card className="space-y-6 p-6">
                <SectionTitle
                  title="Reset Session"
                  subtitle="Force a fresh Parlant session for a WhatsApp number."
                />
                <Field label="Customer number">
                  <input
                    className={inputClass}
                    value={resetNumber}
                    placeholder="7904220338"
                    onChange={(event) => setResetNumber(event.target.value)}
                  />
                </Field>
                <Button type="button" variant="outline" onClick={onResetSession}>
                  Reset Session
                </Button>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="space-y-1">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </label>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function MultiValueInput({
  label,
  placeholder,
  items,
  onChange
}: {
  label: string;
  placeholder: string;
  items: string[];
  onChange: (items: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  const addItem = () => {
    const value = draft.trim();
    if (!value || items.includes(value)) {
      setDraft("");
      return;
    }
    onChange([...items, value]);
    setDraft("");
  };

  const removeItem = (value: string) => {
    onChange(items.filter((item) => item !== value));
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          className={`${inputClass} flex-1`}
          placeholder={placeholder}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addItem();
            }
          }}
        />
        <Button type="button" variant="outline" onClick={addItem}>
          Add
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs"
          >
            {item}
            <button
              type="button"
              onClick={() => removeItem(item)}
              className="text-muted-foreground hover:text-foreground"
              aria-label={`Remove ${item}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
