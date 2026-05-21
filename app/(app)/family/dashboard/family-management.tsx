"use client";

import Link from "next/link";
import { PencilIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type FamilyManagementProps = {
  familyId: string;
};

export default function FamilyManagement({
  familyId,
}: FamilyManagementProps) {
  return (
    <Button
      asChild
      aria-label="Edit Family"
      className="h-9 gap-2 border border-amber-400 bg-amber-100 px-3 text-amber-900 shadow-sm hover:bg-amber-200"
    >
      <Link href={`/family/${familyId}/edit`}>
        <PencilIcon className="h-4 w-4" />
        <span>Edit</span>
      </Link>
    </Button>
  );
}
