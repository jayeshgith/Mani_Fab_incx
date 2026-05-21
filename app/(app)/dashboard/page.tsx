import RecentTransactions from "./recent-transactions";
import CashFlow from "./transactions/cashflow";
import Link from "next/link";
import { UsersRound } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { auth } from "@/auth";
import { getFamilyDashboardData } from "@/data/getFamilyDashboardData";
import { getFamilyAccessByEmail } from "@/lib/family-access";
import { getGroupAccessByEmail } from "@/lib/group-access";
import { format } from "date-fns";
import numeral from "numeral";
import CashflowChart from "../groups/dashboard/cashflow-chart";
import FamilyRecentTransactionsFilters from "./family-recent-transactions-filters";
import TransactionTypeFilter from "./transaction-type-filter";

const DashboardPage = async ({
  searchParams,
}: {
  searchParams: Promise<{
    cfyear?: string;
    scope?: string;
    familyTxType?: string;
    familyTxMonth?: string;
    familyTxYear?: string;
    familyTxDate?: string;
    familyTxRange?: string;
  }>;
}) => {
  const params = await searchParams;
  const today = new Date();
  let cfyear = Number(
    params.cfyear || today.getFullYear().toString()
  );
  if (!cfyear || isNaN(cfyear)) {
    cfyear = today.getFullYear();
  }

  const session = await auth();
  let hasOwnedGroups = false;
  let hasSocietyMembership = false;
  let hasFamilyMembership = false;
  let hasFamilyDashboard = false;

  if (session?.user?.email) {
    const groupAccess = await getGroupAccessByEmail(session.user.email);
    const familyAccess = await getFamilyAccessByEmail(session.user.email);
    hasOwnedGroups = groupAccess?.hasOwnedGroups ?? false;
    hasSocietyMembership =
      (groupAccess?.hasOwnedGroups ?? false) ||
      (groupAccess?.isMemberInOtherGroup ?? false);
    hasFamilyMembership = familyAccess?.hasFamilyMembership ?? false;
    hasFamilyDashboard = familyAccess?.hasOwnedFamily ?? false;
  }

  const selectedScope: "personal" | "society" | "family" =
    params.scope === "society" && hasSocietyMembership
      ? "society"
      : params.scope === "family" && hasFamilyMembership
        ? "family"
        : params.scope === "family" && !hasFamilyMembership && hasSocietyMembership
          ? "society"
          : "personal";
  const isSocietyScope = selectedScope === "society";
  const isFamilyScope = selectedScope === "family";

  const parsedFamilyTxMonth = Number(params.familyTxMonth);
  const familyTxType =
    params.familyTxType === "income" || params.familyTxType === "expense"
      ? params.familyTxType
      : "all";
  const familyTxMonth =
    Number.isInteger(parsedFamilyTxMonth) &&
    parsedFamilyTxMonth >= 1 &&
    parsedFamilyTxMonth <= 12
      ? parsedFamilyTxMonth
      : undefined;
  const parsedFamilyTxYear = Number(params.familyTxYear);
  const familyTxYear =
    Number.isInteger(parsedFamilyTxYear) && parsedFamilyTxYear > 1900
      ? parsedFamilyTxYear
      : undefined;
  const familyTxDate =
    typeof params.familyTxDate === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(params.familyTxDate)
      ? params.familyTxDate
      : undefined;
  const familyTxRange = params.familyTxRange === "all" ? "all" : undefined;

  const familyData = isFamilyScope
    ? await getFamilyDashboardData({
        recentType: familyTxType,
        recentMonth: familyTxMonth,
        recentYear: familyTxYear,
        recentDate: familyTxDate,
        recentRange: familyTxRange,
      })
    : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5">
        <h1 className="text-3xl font-semibold sm:text-4xl">Dashboard</h1>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          {hasSocietyMembership || hasFamilyMembership ? (
            <TransactionTypeFilter
              value={selectedScope}
              showSociety={hasSocietyMembership}
              showFamily={hasFamilyMembership}
            />
          ) : null}
          {hasOwnedGroups ? (
            <Button variant="outline" asChild className="w-full gap-2 sm:w-auto">
              <Link href="/groups/dashboard">
                <UsersRound className="h-4 w-4" />
                Society Dashboard
              </Link>
            </Button>
          ) : null}
          {hasFamilyDashboard ? (
            <Button variant="outline" asChild className="w-full gap-2 sm:w-auto">
              <Link href="/family/dashboard">
                <UsersRound className="h-4 w-4" />
                Family Dashboard
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
      {isFamilyScope ? (
        familyData?.hasFamily ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Family Name</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold text-slate-900">
                  {familyData.familyName}
                </p>
              </CardContent>
            </Card>

            <CashflowChart
              title={`Family Cashflow (${familyData.year})`}
              annualCashflow={familyData.annualCashflow}
            />

            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <CardTitle>Family Recent Transactions</CardTitle>
                  <FamilyRecentTransactionsFilters
                    yearsRange={familyData.yearsRange}
                    type={familyTxType}
                    month={familyTxMonth}
                    year={familyTxYear}
                    date={familyTxDate}
                  />
                </div>
              </CardHeader>
              <CardContent>
                {familyData.recentTransactions.length === 0 ? (
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
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {familyData.recentTransactions.map((tx) => (
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
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No Family Yet</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                You have not created or joined a family yet.
              </p>
            </CardContent>
          </Card>
        )
      ) : (
        <>
          <CashFlow
            year={cfyear}
            scope={isSocietyScope ? "society" : "personal"}
            title={
              isSocietyScope
                ? "Society Transaction Cash Flow"
                : "Personal Cash Flow"
            }
            showFilters={!isSocietyScope}
          />
          <RecentTransactions
            scope={isSocietyScope ? "society" : "personal"}
            title={
              isSocietyScope
                ? "Society Recent Transactions"
                : "Personal Recent Transactions"
            }
            showActions
            showRowActions
            viewAllHref={
              isSocietyScope
                ? "/dashboard/transactions?scope=society"
                : "/dashboard/transactions"
            }
            createHref={
              isSocietyScope
                ? "/dashboard/transactions/new?scope=society"
                : "/dashboard/transactions/new"
            }
          />
        </>
      )}
    </div>
  );
};

export default DashboardPage;
