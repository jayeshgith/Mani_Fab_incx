export type Category = {
  _id: string;
  name: string;
  type: "income" | "expense";
  scope?: "personal" | "family" | "social";
};
