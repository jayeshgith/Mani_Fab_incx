import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { auth } from "@/auth";
import { getFamilyDashboardData } from "@/data/getFamilyDashboardData";
import { getFamilyAccessByEmail } from "@/lib/family-access";
import { format } from "date-fns";
import numeral from "numeral";
import CashflowChart from "../../groups/dashboard/cashflow-chart";
import FamilyManagement from "./family-management";
import FamilyRecentTransactionsFilters from "./recent-transactions-filters";
import TransactionRowActionsClient from "../../dashboard/transaction-row-actions.client";
import { getUserAvatarUrl } from "@/lib/avatar";

export default async function FamilyDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    txType?: string;
    txMonth?: string;
    txYear?: string;
    txDate?: string;
    txRange?: string;
  }>;
}) {
  const params = await searchParams;
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login");
  }

  const familyAccess = await getFamilyAccessByEmail(session.user.email);
  if (!familyAccess) {
    redirect("/dashboard");
  }

  const parsedTxMonth = Number(params.txMonth);
  const txType =
    params.txType === "income" || params.txType === "expense"
      ? params.txType
      : "all";
  const txMonth =
    Number.isInteger(parsedTxMonth) && parsedTxMonth >= 1 && parsedTxMonth <= 12
      ? parsedTxMonth
      : undefined;
  const parsedTxYear = Number(params.txYear);
  const txYear = Number.isInteger(parsedTxYear) && parsedTxYear > 1900 ? parsedTxYear : undefined;
  const txDate =
    typeof params.txDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(params.txDate)
      ? params.txDate
      : undefined;
  const txRange = params.txRange === "all" ? "all" : undefined;

  const data = await getFamilyDashboardData({
    recentType: txType,
    recentMonth: txMonth,
    recentYear: txYear,
    recentDate: txDate,
    recentRange: txRange,
  });
  if (!data) {
    redirect("/login");
  }

  const familyIncome = data.annualCashflow.reduce(
    (sum, item) => sum + item.totalIncome,
    0,
  );
  const familyExpenses = data.annualCashflow.reduce(
    (sum, item) => sum + item.totalExpenses,
    0,
  );
  const familyBalance = familyIncome - familyExpenses;
  const headingTitle =
    data.hasFamily ? `${data.familyName} Dashboard` : "Family Dashboard";

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-5 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="text-3xl font-bold tracking-tight">{headingTitle}</h1>
            {data.hasFamily && data.canManageFamily ? (
              <FamilyManagement
                familyId={data.familyId}
              />
            ) : null}
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Family overview based on members personal transactions.
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          {data.hasFamily && data.canManageFamily ? (
            <Button asChild className="w-full sm:w-auto">
              <Link href={`/family/${data.familyId}/transfer`}>Money Transfer</Link>
            </Button>
          ) : null}
          <Button variant="outline" asChild className="w-full sm:w-auto">
            <Link href="/dashboard">Main Dashboard</Link>
          </Button>
        </div>
      </div>

      {!data.hasFamily ? (
        <Card>
          <CardHeader>
            <CardTitle>No Family Yet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-600">
              You have not created or joined a family yet.
            </p>
            {familyAccess.canCreateFamily ? (
              <Button asChild>
                <Link href="/groups/new?mode=family">Create Family</Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <>
          {data.canManageFamily ? (
            <Card>
              <CardHeader>
                <CardTitle>User Family A/C ({data.year})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-sm text-emerald-700">Income</p>
                    <p className="mt-1 text-2xl font-bold text-emerald-800">
                      INR {numeral(familyIncome).format("0,0[.]00")}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-300 bg-white p-4 text-center">
                    <p className="text-sm text-slate-600">Remaining Amount</p>
                    <p
                      className={
                        familyBalance >= 0
                          ? "mt-1 text-2xl font-bold text-green-700"
                          : "mt-1 text-2xl font-bold text-red-700"
                      }
                    >
                      INR {numeral(familyBalance).format("0,0[.]00")}
                    </p>
                  </div>

                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                    <p className="text-sm text-rose-700">Expenses</p>
                    <p className="mt-1 text-2xl font-bold text-rose-800">
                      INR {numeral(familyExpenses).format("0,0[.]00")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <CashflowChart
            title={`Family Cashflow (${data.year})`}
            annualCashflow={data.annualCashflow}
          />

          {data.canManageFamily ? (
            <Card>
              <CardHeader>
                <CardTitle>Member Summary ({data.year})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Income</TableHead>
                      <TableHead>Expenses</TableHead>
                      <TableHead>Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.memberSummaries.map((member) => {
                      const balance = member.totalIncome - member.totalExpenses;
                      const memberAvatarSrc = getUserAvatarUrl({
                        image: member.image,
                        name: member.name,
                        email: member.email,
                        size: 72,
                      });
                      return (
                        <TableRow key={member.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <img
                                src={memberAvatarSrc}
                                alt={member.name || "Member"}
                                className="h-9 w-9 rounded-full border border-slate-200 object-cover"
                              />
                              <div className="flex flex-col">
                                <span className="font-medium">{member.name}</span>
                                <span className="text-xs text-slate-500">
                                  {member.email}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{member.phone || "-"}</TableCell>
                          <TableCell>
                            INR {numeral(member.totalIncome).format("0,0[.]00")}
                          </TableCell>
                          <TableCell>
                            INR {numeral(member.totalExpenses).format("0,0[.]00")}
                          </TableCell>
                          <TableCell
                            className={
                              balance >= 0 ? "text-green-600" : "text-red-600"
                            }
                          >
                            INR {numeral(balance).format("0,0[.]00")}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <CardTitle>Family Recent Transactions</CardTitle>
                <FamilyRecentTransactionsFilters
                  yearsRange={data.yearsRange}
                  type={txType}
                  month={txMonth}
                  year={txYear}
                  date={txDate}
                />
              </div>
            </CardHeader>
            <CardContent>
              {data.recentTransactions.length === 0 ? (
                <p className="text-sm text-slate-600">
                  No transactions found for this family.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Member</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      {data.canManageFamily ? (
                        <TableHead className="text-right">Actions</TableHead>
                      ) : null}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recentTransactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>
                          {tx.transactionDate
                            ? format(new Date(tx.transactionDate), "dd MMM yyyy")
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{tx.memberName}</span>
                            <span className="text-xs text-slate-500">
                              {tx.memberEmail}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{tx.description || "-"}</TableCell>
                        <TableCell>{tx.category}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              tx.transactionType === "income"
                                ? "bg-green-500"
                                : "bg-red-500"
                            }
                          >
                            {tx.transactionType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          INR {numeral(tx.amount).format("0,0[.]00")}
                        </TableCell>
                        {data.canManageFamily ? (
                          <TableCell className="text-right">
                            <TransactionRowActionsClient
                              transactionId={tx.id}
                              deleteFirst
                            />
                          </TableCell>
                        ) : null}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
