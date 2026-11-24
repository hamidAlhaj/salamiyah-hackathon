import { Card } from './Card';

/** A labelled figure (money, counts). The value is LTR so amounts and digits never reorder. */
export function StatCard({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <Card className="p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums" dir="ltr">
        {value}
      </p>
      {note && <p className="mt-1 text-xs text-muted">{note}</p>}
    </Card>
  );
}
