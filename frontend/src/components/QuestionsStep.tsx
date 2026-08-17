import type { ExtraQuestion } from "../../lib/types";

export function QuestionsStep({
  questions,
  answers,
  onChange,
  organizer,
}: {
  questions: ExtraQuestion[];
  answers: Record<string, string>;
  onChange: (id: string, value: string) => void;
  organizer: string;
}) {
  return (
    <div className="space-y-4">
      <p className="rounded-md border border-border bg-surface-2 p-3 text-sm text-muted-foreground">
        {organizer} requires a couple of extra details. We save your answers for
        next time, so this is the last time you type them.
      </p>
      {questions.map((q) => (
        <label key={q.id} className="block">
          <span className="label-caps text-muted-foreground">
            {q.label}
            {q.required ? " *" : ""}
          </span>
          {q.type === "select" ? (
            <select
              value={answers[q.id] ?? ""}
              onChange={(e) => onChange(q.id, e.target.value)}
              className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-ring"
            >
              <option value="">Select…</option>
              {q.options?.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          ) : (
            <input
              value={answers[q.id] ?? ""}
              onChange={(e) => onChange(q.id, e.target.value)}
              placeholder={q.placeholder}
              className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:border-ring"
            />
          )}
        </label>
      ))}
    </div>
  );
}
