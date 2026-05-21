"use client";

import { transactionFormDefaultValues } from "@/lib/constants";
import { transactionFormSchema } from "@/lib/validators/transactionFormSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { useEffect, useMemo, useState } from "react";
import z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "./ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Input } from "./ui/input";
import type { Category as CategoryType } from "@/types/Category";

type FamilyGroup = {
  id: string;
  name: string;
};

type CategoryOption = Pick<CategoryType, "_id" | "name" | "type" | "scope">;

type Props = {
  familyGroups: FamilyGroup[];
  hasFamilyMembership?: boolean;
  categories?: CategoryOption[];
  onsubmit: (data: z.input<typeof transactionFormSchema>) => Promise<void>;
  showDynamicTitle?: boolean;
  defaultValues?: Partial<z.input<typeof transactionFormSchema>>;
};

const TransactionForm = ({
  familyGroups,
  hasFamilyMembership = false,
  categories = [],
  onsubmit,
  showDynamicTitle = false,
  defaultValues,
}: Props) => {
  const form = useForm<z.input<typeof transactionFormSchema>>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      ...transactionFormDefaultValues,
      ...defaultValues,
    },
  });

  const accountScope = useWatch({
    control: form.control,
    name: "accountScope",
  });
  const selectedGroupId = useWatch({
    control: form.control,
    name: "groupId",
  });
  const transactionType = useWatch({
    control: form.control,
    name: "transactionType",
  });
  const selectedCategory = useWatch({
    control: form.control,
    name: "category",
  });

  const filteredCategories = useMemo(() => {
    const effectiveCategoryScope =
      accountScope === "society" ? "family" : accountScope;

    const options = categories
      .filter((category) => category.type === transactionType)
      .filter(
        (category) =>
          !category.scope ||
          category.scope === effectiveCategoryScope ||
          category.scope === "social",
      );

    const uniqueByName = new Map<string, CategoryOption>();
    for (const category of options) {
      const normalizedName = category.name.trim().toLowerCase();
      if (!normalizedName || uniqueByName.has(normalizedName)) continue;
      uniqueByName.set(normalizedName, category);
    }

    return Array.from(uniqueByName.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [accountScope, categories, transactionType]);

  const canUseCategorySelect = filteredCategories.length > 0;
  const isSelectedCategoryInList = filteredCategories.some(
    (category) => category.name === selectedCategory,
  );
  const [customCategoryRequested, setCustomCategoryRequested] = useState(false);
  const useCustomCategory =
    !canUseCategorySelect ||
    customCategoryRequested ||
    (Boolean(selectedCategory) && !isSelectedCategoryInList);

  useEffect(() => {
    if (accountScope !== "society") return;

    const currentGroupId = String(form.getValues("groupId") ?? "").trim();
    const hasCurrentGroup = familyGroups.some(
      (group) => group.id === currentGroupId,
    );

    if (hasCurrentGroup) return;

    form.setValue("groupId", familyGroups[0]?.id ?? "", {
      shouldValidate: true,
    });
  }, [accountScope, familyGroups, form]);

  useEffect(() => {
    if (accountScope !== "family") return;
    if (form.getValues("transactionType") === "expense") return;

    form.setValue("transactionType", "expense", {
      shouldValidate: true,
      shouldDirty: true,
    });
  }, [accountScope, form]);

  useEffect(() => {
    if (useCustomCategory || !selectedCategory) return;
    if (isSelectedCategoryInList) return;

    form.setValue("category", "", { shouldValidate: true });
  }, [form, isSelectedCategoryInList, selectedCategory, useCustomCategory]);

  const selectedSocietyName =
    familyGroups.find((group) => group.id === selectedGroupId)?.name ??
    familyGroups[0]?.name ??
    "No society available";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onsubmit)}>
        {showDynamicTitle ? (
          <h2 className="mb-6 text-3xl font-bold tracking-tight">
            {accountScope === "society"
              ? "Society Transaction"
              : accountScope === "family"
                ? "Family Transaction"
                : "New Transaction"}
          </h2>
        ) : null}
        <fieldset
          disabled={form.formState.isSubmitting}
          className="grid grid-cols-1 items-start gap-x-2 gap-y-5 sm:grid-cols-2"
        >
          <FormField
            control={form.control}
            name="accountScope"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormLabel>Account Type</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={(newValue) => {
                        field.onChange(newValue);
                        if (newValue !== "society") {
                          form.setValue("groupId", "");
                        }
                      }}
                      value={field.value}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="w-full">
                        <SelectItem value="personal">Personal</SelectItem>
                        <SelectItem
                          value="society"
                          disabled={familyGroups.length === 0}
                        >
                          Society
                        </SelectItem>
                        <SelectItem
                          value="family"
                          disabled={!hasFamilyMembership}
                        >
                          Family
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
          <FormField
            control={form.control}
            name="transactionType"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormLabel>Transaction Type</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={(newValue) => {
                        field.onChange(newValue);
                      }}
                      value={field.value}
                      disabled={accountScope === "family"}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="w-full">
                        {accountScope !== "family" ? (
                          <SelectItem value="income">Income</SelectItem>
                        ) : null}
                        <SelectItem value="expense">Expense</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
          {accountScope === "society" ? (
            <FormField
              control={form.control}
              name="groupId"
              render={() => {
                return (
                  <FormItem>
                    <FormLabel>Society</FormLabel>
                    <FormControl>
                      <Input value={selectedSocietyName} disabled />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          ) : null}
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => {
              return (
                <FormItem>
                  <div className="flex items-center justify-between gap-2">
                    <FormLabel>Category</FormLabel>
                    {canUseCategorySelect ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCustomCategoryRequested(!useCustomCategory);
                          form.setValue("category", "", {
                            shouldValidate: true,
                          });
                        }}
                      >
                        {useCustomCategory
                          ? "Use Category List"
                          : "Add Category"}
                      </Button>
                    ) : null}
                  </div>
                  <FormControl>
                    {useCustomCategory ? (
                      <Input {...field} placeholder="Enter category" />
                    ) : (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent className="w-full">
                          {filteredCategories.map((category) => (
                            <SelectItem
                              key={category._id}
                              value={category.name}
                            >
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </FormControl>
                  {!canUseCategorySelect ? (
                    <p className="text-xs text-muted-foreground">
                      No categories found for this type. Enter a new category.
                    </p>
                  ) : null}
                  <FormMessage />
                </FormItem>
              );
            }}
          />
          <FormField
            control={form.control}
            name="transactionDate"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormLabel>Transaction Date</FormLabel>
                  <FormControl>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          data-empty={!field.value}
                          className={cn(
                            "w-full data-[empty=true]:text-muted-foreground justify-start text-left font-normal",
                            !field.value && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? (
                            format(field.value as string, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={new Date(field.value as string)}
                          onSelect={field.onChange}
                          disabled={{ after: new Date() }}
                          data-set="calendar"
                        />
                      </PopoverContent>
                    </Popover>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      value={field.value as string}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        </fieldset>
        <fieldset
          disabled={form.formState.isSubmitting}
          className="mt-5 flex flex-col gap-5"
        >
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
          <Button type="submit">Submit</Button>
        </fieldset>
      </form>
    </Form>
  );
};

export default TransactionForm;
