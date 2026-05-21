import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

type TransactionBreadcrumbsProps = {
  scope?: "personal" | "society" | "family";
  current: "history" | "new";
};

export default function TransactionBreadcrumbs({
  scope = "personal",
  current,
}: TransactionBreadcrumbsProps) {
  const dashboardHref =
    scope === "society"
      ? "/dashboard?scope=society"
      : scope === "family"
        ? "/dashboard?scope=family"
        : "/dashboard";
  const historyHref =
    scope === "society"
      ? "/dashboard/transactions?scope=society"
      : scope === "family"
        ? "/dashboard/transactions?scope=family"
      : "/dashboard/transactions";

  return (
    <div className="mb-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={dashboardHref}>Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            {current === "history" ? (
              <BreadcrumbPage>Transactions</BreadcrumbPage>
            ) : (
              <BreadcrumbLink asChild>
                <Link href={historyHref}>Transactions</Link>
              </BreadcrumbLink>
            )}
          </BreadcrumbItem>
          {current === "new" ? (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>New Transaction</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          ) : null}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}
