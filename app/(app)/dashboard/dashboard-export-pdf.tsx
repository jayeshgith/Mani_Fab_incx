"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download } from "lucide-react";
import { toast } from "sonner";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function DashboardExportPdf({
  scope = "personal",
}: {
  scope?: "personal" | "society" | "family";
}) {
  const today = new Date();
  const [mode, setMode] = useState<"month" | "week">("month");
  const [year, setYear] = useState(today.getFullYear().toString());
  const [month, setMonth] = useState((today.getMonth() + 1).toString());
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reports/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope, mode, year: Number(year), month: Number(month) }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to fetch report");
      }

      const data = await res.json();

      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFontSize(18);
      doc.text(data.reportTitle, 14, 20);

      doc.setFontSize(10);
      doc.text(`Generated: ${data.generatedAt}`, 14, 28);
      doc.text(`User: ${data.userName} (${data.userEmail})`, 14, 34);

      doc.setFontSize(12);
      doc.text("Summary", 14, 46);

      autoTable(doc, {
        startY: 50,
        head: [["Metric", "Amount"]],
        body: [
          ["Total Income", `INR ${data.summary.totalIncome}`],
          ["Total Expenses", `INR ${data.summary.totalExpenses}`],
          ["Remaining Amount", `INR ${data.summary.remaining}`],
        ],
        theme: "striped",
        headStyles: { fillColor: [79, 70, 229] },
      });

      const tableStart = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

      doc.setFontSize(12);
      doc.text("Transaction History", 14, tableStart);

      const txHeaders = ["Date", "Description", "Type", "Category", "Amount", "History"];
      const txBody = data.transactions.map((tx: { transactionDate: string; description: string; transactionType: string; category: string; amount: number; historyLabel: string }) => [
        tx.transactionDate ? new Date(tx.transactionDate).toLocaleDateString() : "-",
        tx.description || "-",
        tx.transactionType,
        tx.category,
        `INR ${Number(tx.amount).toLocaleString()}`,
        tx.historyLabel || "-",
      ]);

      autoTable(doc, {
        startY: tableStart + 6,
        head: [txHeaders],
        body: txBody,
        theme: "striped",
        headStyles: { fillColor: [79, 70, 229] },
        styles: { fontSize: 8 },
      });

      doc.save(`fabinex-report-${scope}-${year}-${month}.pdf`);
      toast.success("PDF downloaded successfully!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to download PDF");
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2" disabled={loading}>
          <Download className="h-4 w-4" />
          {loading ? "Downloading..." : "Download Report"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72">
        <div className="space-y-3">
          <h3 className="font-medium text-sm">Export Report</h3>

          <div className="space-y-1">
            <label className="text-xs text-slate-500">Mode</label>
            <Select value={mode} onValueChange={(v: "month" | "week") => setMode(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Monthly</SelectItem>
                <SelectItem value="week">Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-500">Year</label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }, (_, i) => today.getFullYear() - i).map((y) => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-500">Month</label>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((name, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleDownload} className="w-full" disabled={loading}>
            {loading ? "Generating..." : "Download Now"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
