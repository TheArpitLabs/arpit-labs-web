interface AdminTableProps {
  headers: string[];
  children: React.ReactNode;
}

export function AdminTable({ headers, children }: AdminTableProps) {
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-border/70 dark:border-slate-800">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border/70 text-sm dark:divide-slate-800">
          <thead className="bg-surface/70 dark:bg-slate-900/70">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/70 bg-background/70 dark:divide-slate-800 dark:bg-slate-950/40">
            {children}
          </tbody>
        </table>
      </div>
    </div>
  );
}
