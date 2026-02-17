import { CreateSessionForm } from "@/components/create-session-form";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-[#1c093f]">mealSync</h1>
          <p className="text-muted-foreground">
            Drop a link in the group chat. Everyone types when they&apos;re
            free. AI finds the best time.
          </p>
        </div>
        <CreateSessionForm />
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            No accounts. No grids. Just text.
          </p>
        </div>
      </div>
    </main>
  );
}
