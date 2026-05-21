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
import { getTransactionsByMonth } from "@/data/getTransactionsByMonth";
import { format } from "date-fns";
import Link from "next/link";
import z from "zod";
import numeral from "numeral";
import { Badge } from "@/components/ui/badge";
import Filters from "./filters";
import { getTransactionYearsRange } from "@/data/getTransactionYearsRange";
import TransactionRowActionsClient from "../transaction-row-actions.client";
import TransactionBreadcrumbs from "./transaction-breadcrumbs";

function isFamilyTransferTransaction(params: {
  category: unknown;
  description: unknown;
}) {
  const normalizedCategory = String(params.category ?? "").trim().toLowerCase();
  const normalizedDescription = String(params.description ?? "").trim().toLowerCase();

  return (
    normalizedCategory === "paid money" ||
    normalizedCategory === "money transfer" ||
    normalizedDescription.startsWith("paid money:") ||
    normalizedDescription.startsWith("family money transfer")
  );
}

const today = new Date();
const searchSchema = z.object({
  year: z.preprocess(
    (value) => {
      if (value === undefined || value === null || value === "") return undefined;
      return Number(value);
    },
    z
      .number()
      .int()
      .min(today.getFullYear() - 100)
      .max(today.getFullYear() + 1)
      .optional(),
  ),
  month: z.preprocess(
    (value) => {
      if (value === undefined || value === null || value === "") return undefined;
      return Number(value);
    },
    z.number().int().min(1).max(12).optional(),
  ),
  scope: z.enum(["personal", "society", "family"]).catch("personal"),
});

const TransactionsPage = async ({
  searchParams,
}: {
  searchParams: Promise<{
    month?: string;
    year?: string;
    scope?: string;
  }>;
}) => {
  const searchParamsData = await searchParams;
  const { month, year, scope } = searchSchema.parse(searchParamsData);
  const isSocietyScope = scope === "society";
  const isFamilyScope = scope === "family";
  const isAllHistory = typeof month !== "number" && typeof year !== "number";
  const isYearOnly = typeof year === "number" && typeof month !== "number";
  const selectedDate =
    typeof month === "number" && typeof year === "number"
      ? new Date(year, month - 1, 1)
      : null;

  const transactions = await getTransactionsByMonth({
    year,
    month,
    scope: isSocietyScope ? "society" : isFamilyScope ? "family" : "personal",
  });
  const yearsRange = await getTransactionYearsRange({
    scope: isSocietyScope ? "society" : isFamilyScope ? "family" : "personal",
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <TransactionBreadcrumbs
        scope={isSocietyScope ? "society" : isFamilyScope ? "family" : "personal"}
        current="history"
      />

      <Card className="mt-6 p-4 sm:p-6">
        <CardHeader>
          <CardTitle className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>
              {selectedDate ? format(selectedDate, "MMM yyyy") : null}
              {selectedDate ? " " : null}
              {isYearOnly ? `${year}` : null}
              {isYearOnly ? " " : null}
              {isAllHistory ? "All " : ""}
              {isSocietyScope
                ? "Society Transactions"
                : isFamilyScope
                  ? "Family Transactions"
                  : "Personal Transactions"}
            </span>
            <Filters
              year={year}
              month={month}
              yearsRange={yearsRange}
              scope={scope}
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full sm:w-auto">
            <Link
              href={
                isSocietyScope
                  ? "/dashboard/transactions/new?scope=society"
                  : isFamilyScope
                    ? "/dashboard/transactions/new?scope=family"
                    : "/dashboard/transactions/new"
              }
            >
              New Transaction
            </Link>
          </Button>

          {transactions?.length === 0 && (
            <p className="py-10 text-center text-lg text-muted-foreground">
              No transactions found.
            </p>
          )}

          {!!transactions?.length && (
            <Table className="mt-4">
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  {isSocietyScope ? <TableHead>Member</TableHead> : null}
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  {!isSocietyScope ? <TableHead>Transaction</TableHead> : null}
                  {isSocietyScope ? <TableHead>Society</TableHead> : null}
                  <TableHead>Amount</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions?.map((transaction) => {
                  const isFamilyTransferTx = isFamilyTransferTransaction({
                    category: transaction.category,
                    description: transaction.description,
                  });
                  const isSocietyHistory = transaction.historyLabel === "Society";
                  const isFamilyHistory = transaction.historyLabel === "Family";

                  return (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {transaction.transactionDate
                          ? format(new Date(transaction.transactionDate), "do MMM yyyy")
                          : "-"}
                      </TableCell>
                      {isSocietyScope ? (
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{transaction.memberName || "Member"}</span>
                            <span className="text-xs text-slate-500">
                              {transaction.memberEmail || "-"}
                            </span>
                          </div>
                        </TableCell>
                      ) : null}
                      <TableCell>{transaction.description || "-"}</TableCell>
                      <TableCell className="capitalize">
                        <Badge
                          className={
                            transaction.transactionType === "income"
                              ? "bg-green-500"
                              : "bg-red-500"
                          }
                        >
                          {transaction.transactionType}
                        </Badge>
                      </TableCell>
                      <TableCell>{transaction.category}</TableCell>
                      {!isSocietyScope ? (
                        <TableCell>
                          {isFamilyHistory ? (
                            <Badge variant="secondary">Family</Badge>
                          ) : isSocietyHistory ? (
                            <Badge variant="secondary">Society</Badge>
                          ) : isFamilyTransferTx ? (
                            <Badge variant="outline">Family</Badge>
                          ) : null}
                        </TableCell>
                      ) : null}
                      {isSocietyScope ? (
                        <TableCell>
                          <Badge variant="default">
                            {transaction.historyLabel || "Society"}
                          </Badge>
                        </TableCell>
                      ) : null}
                      <TableCell>
                        INR {numeral(transaction.amount).format("0,0[.]00")}
                      </TableCell>
                      <TableCell className="text-right">
                        {transaction.canManage &&
                        !(
                          !isSocietyScope &&
                          (transaction.historyLabel === "Society" ||
                            isFamilyTransferTx)
                        ) ? (
                          <TransactionRowActionsClient
                            transactionId={transaction.id}
                            deleteFirst
                          />
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionsPage;
