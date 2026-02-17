"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Response } from "@/lib/types";

interface RespondFormProps {
  shortCode: string;
  responses: Response[];
  onSubmitted: () => void;
}

function getUserId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("lunchsync-user-id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("lunchsync-user-id", id);
  }
  return id;
}

export function RespondForm({ shortCode, responses, onSubmitted }: RespondFormProps) {
  const [name, setName] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("lunchsync-name") || "";
    }
    return "";
  });
  const [rawInput, setRawInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [parseError, setParseError] = useState(false);
  const [existingResponse, setExistingResponse] = useState<Response | null>(null);

  // Check if user already responded
  useEffect(() => {
    const storedName = localStorage.getItem("lunchsync-name") || "";
    if (storedName && responses.length > 0) {
      const existing = responses.find(
        (r) => r.name.toLowerCase() === storedName.toLowerCase()
      );
      if (existing) {
        setExistingResponse(existing);
        setSubmitted(true);
        setName(existing.name);
      }
    }
  }, [responses]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !rawInput.trim()) return;

    setLoading(true);
    setParseError(false);
    try {
      localStorage.setItem("lunchsync-name", name.trim());

      const res = await fetch("/api/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shortCode,
          name: name.trim(),
          rawInput: rawInput.trim(),
          userId: getUserId(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.windowCount === 0) {
          setParseError(true);
          setLoading(false);
          return;
        }
        setSubmitted(true);
        setExistingResponse({
          name: data.name,
          rawInput: rawInput.trim(),
          windows: data.windows,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        onSubmitted();
      }
    } catch (err) {
      console.error("Failed to submit:", err);
    } finally {
      setLoading(false);
    }
  }

  if (submitted && existingResponse) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <p className="text-lg font-medium">Got it, {existingResponse.name}!</p>
            <p className="text-muted-foreground text-sm">
              &quot;{existingResponse.rawInput}&quot;
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSubmitted(false);
                setRawInput("");
                setParseError(false);
              }}
            >
              Update my availability
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">When are you free?</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="resp-name">Your name</Label>
            <Input
              id="resp-name"
              placeholder="Alex"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="availability">Your availability</Label>
            <Textarea
              id="availability"
              placeholder="Free Thursday and Friday after 1pm"
              value={rawInput}
              onChange={(e) => {
                setRawInput(e.target.value);
                setParseError(false);
              }}
              required
              rows={3}
              className="resize-none"
            />
            {parseError ? (
              <p className="text-xs text-red-500">
                Couldn&apos;t understand that — try something like &quot;free
                Thursday 1-3pm&quot; or &quot;any day after noon&quot;
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Just type naturally — &quot;free Thursday after 1&quot;,
                &quot;any day except Wednesday&quot;, &quot;lunch on Friday
                works&quot;
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Reading your availability...
              </span>
            ) : existingResponse ? (
              "Update"
            ) : (
              "Submit"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
