import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function getCurrentUser() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return null;
  }

  const email =
    clerkUser.emailAddresses.find(
      (email) => email.id === clerkUser.primaryEmailAddressId
    )?.emailAddress ?? null;

  const name =
    clerkUser.fullName ||
    clerkUser.firstName ||
    clerkUser.username ||
    null;

  return prisma.user.upsert({
    where: {
      clerkId: clerkUser.id,
    },
    update: {
      email,
      name,
    },
    create: {
      clerkId: clerkUser.id,
      email,
      name,
    },
  });
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  return user;
}