"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RespondFormProps {
  shortCode: string;
  onSubmitted: () => void;
}

export function RespondForm({ shortCode, onSubmitted }: RespondFormProps) {
  const [name, setName] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("lunchsync-name") || "";
    }
    return "";
  });
  const [rawInput, setRawInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !rawInput.trim()) return;

    setLoading(true);
    try {
      localStorage.setItem("lunchsync-name", name.trim());

      const res = await fetch("/api/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shortCode,
          name: name.trim(),
          rawInput: rawInput.trim(),
        }),
      });

      if (res.ok) {
        setSubmitted(true);
        onSubmitted();
      }
    } catch (err) {
      console.error("Failed to submit:", err);
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <p className="text-lg font-medium">Got it, {name}!</p>
            <p className="text-muted-foreground text-sm">
              Your availability has been recorded.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSubmitted(false);
                setRawInput("");
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
              onChange={(e) => setRawInput(e.target.value)}
              required
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Just type naturally — &quot;free Thursday after 1&quot;, &quot;any
              day except Wednesday&quot;, &quot;lunch on Friday works&quot;
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Parsing your availability..." : "Submit"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
