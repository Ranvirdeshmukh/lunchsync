"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CreateSessionForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [name, setName] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("lunchsync-name") || "";
    }
    return "";
  });
  const [dateRangeStart, setDateRangeStart] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [dateRangeEnd, setDateRangeEnd] = useState(() => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek.toISOString().split("T")[0];
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !name.trim()) return;

    setLoading(true);
    try {
      localStorage.setItem("lunchsync-name", name.trim());

      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          dateRangeStart,
          dateRangeEnd,
          createdBy: name.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        router.push(`/j/${data.shortCode}`);
      }
    } catch (err) {
      console.error("Failed to create session:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-xl">Create a scheduling session</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">What are you planning?</Label>
            <Input
              id="title"
              placeholder="Lunch this week"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Your name</Label>
            <Input
              id="name"
              placeholder="Alex"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="start">From</Label>
              <Input
                id="start"
                type="date"
                value={dateRangeStart}
                onChange={(e) => setDateRangeStart(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end">To</Label>
              <Input
                id="end"
                type="date"
                value={dateRangeEnd}
                onChange={(e) => setDateRangeEnd(e.target.value)}
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating..." : "Create & Share Link"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
