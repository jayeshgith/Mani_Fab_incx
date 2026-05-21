"use client";

import Link from "next/link";
import { PencilIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type GroupManagementProps = {
  groupId: string;
};

export default function GroupManagement({
  groupId,
}: GroupManagementProps) {
  return (
    <Button
      asChild
      aria-label="Edit Society"
      className="h-9 gap-2 border border-amber-400 bg-amber-100 px-3 text-amber-900 shadow-sm hover:bg-amber-200"
    >
      <Link href={`/groups/${groupId}/edit`}>
        <PencilIcon className="h-4 w-4" />
        <span>Edit</span>
      </Link>
    </Button>
  );
}
