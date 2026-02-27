import { FileText, Download } from 'lucide-react';

const reports = [
  { name: 'Fleet Performance Summary', date: '2026-02-22', type: 'Performance', size: '2.4 MB' },
  { name: 'Battery Health Analysis', date: '2026-02-20', type: 'Battery', size: '1.8 MB' },
  { name: 'Energy Consumption Report', date: '2026-02-18', type: 'Energy', size: '3.1 MB' },
  { name: 'Maintenance Cost Breakdown', date: '2026-02-15', type: 'Maintenance', size: '1.2 MB' },
  { name: 'Driver Efficiency Scores', date: '2026-02-12', type: 'Performance', size: '0.9 MB' },
  { name: 'Charging Infrastructure Usage', date: '2026-02-10', type: 'Charging', size: '2.7 MB' },
];

const Reports = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-muted-foreground">Generate and download fleet reports</p>
      </div>
      <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-default">
        <FileText className="h-4 w-4" /> Generate Report
      </button>
    </div>

    <div className="rounded-lg border bg-card card-shadow overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Report Name</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Type</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Size</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {reports.map((r, i) => (
            <tr key={i} className="hover:bg-muted/30 transition-default">
              <td className="px-4 py-3 font-medium">{r.name}</td>
              <td className="px-4 py-3 hidden md:table-cell">
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">{r.type}</span>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{r.date}</td>
              <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{r.size}</td>
              <td className="px-4 py-3 text-right">
                <button className="rounded-md p-1.5 hover:bg-muted transition-default">
                  <Download className="h-4 w-4 text-muted-foreground" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default Reports;
