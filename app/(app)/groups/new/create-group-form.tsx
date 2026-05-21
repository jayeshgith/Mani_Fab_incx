"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, UserPlus, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type SearchUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  image: string;
};

type CreateGroupFormProps = {
  mode?: "society" | "family";
};

export default function CreateGroupForm({
  mode = "society",
}: CreateGroupFormProps) {
  const router = useRouter();
  const isFamilyMode = mode === "family";
  const entityLabel = isFamilyMode ? "Family" : "Society";
  const memberSearchEndpoint = isFamilyMode
    ? "/api/users/search-family"
    : "/api/users/search";
  const createEndpoint = isFamilyMode ? "/api/families" : "/api/groups";
  const successRedirect = isFamilyMode ? "/family/dashboard" : "/groups/dashboard";

  const [groupName, setGroupName] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");

  const selectedMemberIdSet = useMemo(
    () => new Set(selectedMembers.map((member) => member.id)),
    [selectedMembers],
  );

  const loadMembers = useCallback(async (searchQuery: string) => {
    setMessage("");

    setSearching(true);

    try {
      const res = await fetch(
        `${memberSearchEndpoint}?query=${encodeURIComponent(searchQuery)}`,
        { cache: "no-store" },
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMessage(data?.error ?? "Unable to search users right now.");
        setResults([]);
        setSearching(false);
        return;
      }

      const foundUsers = Array.isArray(data?.users) ? data.users : [];
      setResults(foundUsers);
      if (foundUsers.length === 0) {
        setMessage(
          searchQuery
            ? "No users found for this name or phone number."
            : "No available users found right now.",
        );
      } else {
        setMessage("");
      }
    } catch {
      setResults([]);
      setMessage("Something went wrong while searching users.");
    } finally {
      setSearching(false);
    }
  }, [memberSearchEndpoint]);

  async function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadMembers(query.trim());
  }

  useEffect(() => {
    void loadMembers("");
  }, [loadMembers]);

  function addMember(user: SearchUser) {
    if (selectedMemberIdSet.has(user.id)) return;
    setSelectedMembers((current) => [...current, user]);
  }

  function removeMember(memberId: string) {
    setSelectedMembers((current) =>
      current.filter((member) => member.id !== memberId),
    );
  }

  async function onCreateGroup() {
    setMessage("");

    const trimmedGroupName = groupName.trim();
    if (!trimmedGroupName) {
      setMessage(`${entityLabel} name is required.`);
      return;
    }

    if (selectedMembers.length === 0) {
      setMessage(
        `Add at least one ${entityLabel.toLowerCase()} member to create a ${entityLabel.toLowerCase()}.`,
      );
      return;
    }

    setCreating(true);

    try {
      const res = await fetch(createEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedGroupName,
          memberIds: selectedMembers.map((member) => member.id),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMessage(
          data?.error ?? `Unable to create ${entityLabel.toLowerCase()}.`,
        );
        setCreating(false);
        return;
      }

      router.push(successRedirect);
      router.refresh();
    } catch {
      setMessage(
        `Something went wrong while creating ${entityLabel.toLowerCase()}.`,
      );
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-3 flex flex-wrap gap-2">
            <Button
              asChild
              variant={isFamilyMode ? "outline" : "default"}
              size="sm"
            >
              <Link href="/groups/new">Create Society</Link>
            </Button>
            <Button
              asChild
              variant={isFamilyMode ? "default" : "outline"}
              size="sm"
            >
              <Link href="/groups/new?mode=family">Create Family</Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Create {entityLabel}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Create your {entityLabel.toLowerCase()} and add members by name or
            phone number.
          </p>
        </div>
        <Button variant="outline" asChild className="w-full sm:w-auto">
          <Link href="/dashboard">Back</Link>
        </Button>
      </div>

      <div className="space-y-6 rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            {entityLabel} Name
          </label>
          <Input
            value={groupName}
            onChange={(event) => setGroupName(event.target.value)}
            placeholder={
              isFamilyMode ? "Example: Sharma Family" : "Example: Greenview Society"
            }
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">
            Search Member By Name or Phone
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
            Available members are shown by default. Use search to filter.
          </p>
        </div>

        <div className="space-y-3">
          {results.map((user) => {
            const isAdded = selectedMemberIdSet.has(user.id);

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
              No users found.
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" className="gap-2">
                <Users className="h-4 w-4" />
                Selected Members ({selectedMembers.length})
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[min(20rem,calc(100vw-2rem))]">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-900">
                  Added Members
                </p>
                {selectedMembers.length === 0 ? (
                  <p className="text-sm text-slate-500">No members added yet.</p>
                ) : (
                  selectedMembers.map((member) => (
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
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeMember(member.id)}
                        aria-label="Remove member"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>

          <Button
            type="button"
            onClick={onCreateGroup}
            disabled={creating}
            className="w-full sm:ml-auto sm:w-auto"
          >
            {creating ? `Creating ${entityLabel}...` : `Create ${entityLabel}`}
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
