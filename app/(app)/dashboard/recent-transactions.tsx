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
import { getRecentTransactions } from "@/data/getRecentTransactions";
import { format } from "date-fns";
import Link from "next/link";
import numeral from "numeral";
import TransactionRowActionsClient from "./transaction-row-actions.client";

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

const RecentTransactions = async ({
  scope = "personal",
  title = "Recent Transactions",
  showActions = true,
  showRowActions = false,
  viewAllHref = "/dashboard/transactions",
  createHref = "/dashboard/transactions/new",
}: {
  scope?: "personal" | "society" | "family";
  title?: string;
  showActions?: boolean;
  showRowActions?: boolean;
  viewAllHref?: string;
  createHref?: string;
}) => {
  const isSocietyScope = scope === "society" || scope === "family";
  const recentTransactions = await getRecentTransactions({ scope });
  const emptyMessage =
    isSocietyScope
      ? "You have no society transactions yet. Start by creating a new society transaction."
      : "You have no transactions yet. Start by creating a new transaction.";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span>{title}</span>
          {showActions ? (
            <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
              <Button variant="outline" asChild className="w-full sm:w-auto">
                <Link href={viewAllHref}>View All</Link>
              </Button>
              <Button asChild className="w-full sm:w-auto">
                <Link href={createHref}>Create New</Link>
              </Button>
            </div>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recentTransactions?.length === 0 && (
          <p className="py-10 text-center text-lg text-muted-foreground">
            {emptyMessage}
          </p>
        )}
        {!!recentTransactions?.length && (
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
                {showRowActions ? (
                  <TableHead className="text-right">Actions</TableHead>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTransactions?.map((transaction) => {
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
                        ? format(
                            new Date(transaction.transactionDate),
                            "do MMM yyyy",
                          )
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
                    {showRowActions ? (
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
                    ) : null}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentTransactions;
