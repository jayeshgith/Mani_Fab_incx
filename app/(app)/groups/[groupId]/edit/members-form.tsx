"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, UserPlus, Users, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type GroupMember = {
  id: string;
  name: string;
  email: string;
  phone: string;
  image: string;
  isOwner: boolean;
};

type SearchUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  image: string;
};

type EditGroupMembersFormProps = {
  groupId: string;
  groupName: string;
  initialMembers: GroupMember[];
};

export default function EditGroupMembersForm({
  groupId,
  groupName,
  initialMembers,
}: EditGroupMembersFormProps) {
  const router = useRouter();
  const [name, setName] = useState(groupName);
  const [savedName, setSavedName] = useState(groupName.trim());
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [members, setMembers] = useState<GroupMember[]>(initialMembers);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const memberIdSet = useMemo(
    () => new Set(members.map((member) => member.id)),
    [members],
  );

  const searchUsers = useCallback(
    async (rawValue: string) => {
      const trimmedQuery = rawValue.trim();
      setMessage("");
      setSearching(true);

      try {
        const response = await fetch(
          `/api/users/search?query=${encodeURIComponent(trimmedQuery)}&groupId=${encodeURIComponent(groupId)}`,
          { cache: "no-store" },
        );

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          setMessage(data?.error ?? "Unable to search users right now.");
          setResults([]);
          setSearching(false);
          return;
        }

        const foundUsers = Array.isArray(data?.users) ? data.users : [];
        setResults(foundUsers);
        if (foundUsers.length === 0) {
          setMessage(
            trimmedQuery
              ? "No available users found for this name or phone number."
              : "No available users found right now.",
          );
        }
      } catch {
        setResults([]);
        setMessage("Something went wrong while searching users.");
      } finally {
        setSearching(false);
      }
    },
    [groupId],
  );

  useEffect(() => {
    void searchUsers("");
  }, [searchUsers]);

  async function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    await searchUsers(query);
  }

  function addMember(user: SearchUser) {
    if (memberIdSet.has(user.id)) return;
    setMembers((current) => [
      ...current,
      {
        ...user,
        isOwner: false,
      },
    ]);
  }

  function removeMember(memberId: string) {
    setMembers((current) =>
      current.filter((member) => member.id !== memberId || member.isOwner),
    );
  }

  function didMembersChange() {
    const initialIds = initialMembers.map((member) => member.id).sort();
    const currentIds = members.map((member) => member.id).sort();

    if (initialIds.length !== currentIds.length) {
      return true;
    }

    return initialIds.some((id, index) => id !== currentIds[index]);
  }

  async function onSaveName() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setMessage("Society name is required.");
      return;
    }

    if (trimmedName === savedName) {
      toast.info("No name changes to save.");
      return;
    }

    setMessage("");
    setSaving(true);

    try {
      const renameResponse = await fetch(`/api/groups/${groupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName }),
      });

      const renameData = await renameResponse.json().catch(() => ({}));
      if (!renameResponse.ok) {
        setMessage(renameData?.error ?? "Unable to update society name.");
        setSaving(false);
        return;
      }

      setSavedName(trimmedName);
      toast.success("Society name updated successfully.");
      router.refresh();
    } catch {
      setMessage("Something went wrong while updating society name.");
      setSaving(false);
      return;
    }

    setSaving(false);
  }

  async function onSaveChanges() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setMessage("Society name is required.");
      return;
    }
    const nameChanged = trimmedName !== savedName;
    const membersChanged = didMembersChange();

    if (!nameChanged && !membersChanged) {
      toast.info("No changes to save.");
      return;
    }

    setMessage("");
    setSaving(true);

    try {
      if (nameChanged) {
        const renameResponse = await fetch(`/api/groups/${groupId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmedName }),
        });

        const renameData = await renameResponse.json().catch(() => ({}));
        if (!renameResponse.ok) {
          setMessage(renameData?.error ?? "Unable to update society name.");
          setSaving(false);
          return;
        }
      }

      if (membersChanged) {
        const response = await fetch(`/api/groups/${groupId}/members`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            memberIds: members.map((member) => member.id),
          }),
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          setMessage(data?.error ?? "Unable to update society members.");
          setSaving(false);
          return;
        }
      }

      if (nameChanged && membersChanged) {
        toast.success("Society updated successfully.");
      } else if (nameChanged) {
        setSavedName(trimmedName);
        toast.success("Society name updated successfully.");
      } else {
        toast.success("Society members updated successfully.");
      }
      router.push(`/groups/dashboard?groupId=${encodeURIComponent(groupId)}`);
      router.refresh();
    } catch {
      setMessage("Something went wrong while updating members.");
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Members</h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage members for <span className="font-semibold">{groupName}</span>.
          </p>
        </div>
        <Button variant="outline" asChild className="w-full sm:w-auto">
          <Link href={`/groups/dashboard?groupId=${encodeURIComponent(groupId)}`}>
            Back to Society Dashboard
          </Link>
        </Button>
      </div>

      <div className="space-y-6 rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">Society Name</p>
          <div className="flex w-full max-w-xl flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              name="societyName"
              placeholder="Society name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full"
            />
            <Button
              type="button"
              onClick={onSaveName}
              disabled={saving}
              className="w-full sm:w-auto"
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">
            Search User By Name or Phone
          </p>
          <form onSubmit={onSearch}>
            <div className="flex w-full max-w-xl flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                name="query"
                placeholder="Name or phone number"
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full sm:w-80 lg:w-[420px]"
              />
              <Button
                type="submit"
                disabled={searching}
                className="w-full px-4 sm:w-auto"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </form>
          <p className="mt-2 text-xs text-slate-500">
            Available users are loaded automatically. Use search to filter.
          </p>
        </div>

        <div className="space-y-3">
          {results.map((user) => {
            const isAdded = memberIdSet.has(user.id);

            return (
              <div
                key={user.id}
                className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {user.name || "User"}
                  </p>
                  <p className="truncate text-xs text-slate-600">{user.phone}</p>
                  <p className="truncate text-xs text-slate-500">{user.email}</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant={isAdded ? "secondary" : "default"}
                  disabled={isAdded}
                  onClick={() => addMember(user)}
                  className="w-full gap-1.5 sm:w-auto"
                >
                  <UserPlus className="h-4 w-4" />
                  {isAdded ? "Added" : "Add Member"}
                </Button>
              </div>
            );
          })}

          {results.length === 0 && !searching ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
              No available users to add right now.
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" className="gap-2">
                <Users className="h-4 w-4" />
                Current Members ({members.length})
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[min(20rem,calc(100vw-2rem))]">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-900">
                  Society Members
                </p>
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between gap-2 rounded-md border border-slate-200 px-2 py-1.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">
                        {member.name || "User"}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {member.phone}
                      </p>
                    </div>
                    {member.isOwner ? (
                      <span className="rounded-full bg-blue-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-blue-700">
                        Admin
                      </span>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeMember(member.id)}
                        aria-label="Remove member"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Button
            type="button"
            onClick={onSaveChanges}
            disabled={saving}
            className="w-full sm:w-auto"
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        {message ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {message}
          </div>
        ) : null}
      </div>
    </div>
  );
}
