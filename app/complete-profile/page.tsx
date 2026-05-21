import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { isProfileComplete } from "@/lib/profile";
import { User } from "@/models/User";
import { redirect } from "next/navigation";
import CompleteProfileForm from "./profile-form";

export default async function CompleteProfilePage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login");
  }

  await connectDB();
  const user = await User.findOne({ email: session.user.email }).lean();

  const initialProfile = {
    email: session.user.email,
    name: user?.name ?? "",
    phone: user?.phone ?? "",
    image: user?.image ?? "",
  };

  if (isProfileComplete(initialProfile)) {
    redirect("/dashboard");
  }

  return <CompleteProfileForm initialProfile={initialProfile} />;
}
