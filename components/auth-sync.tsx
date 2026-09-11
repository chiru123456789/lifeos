"use client";

import { useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";

export default function AuthSync() {
  const { isLoaded, isSignedIn } = useUser();
  const synced = useRef(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || synced.current) {
      return;
    }

    synced.current = true;

    fetch("/api/auth/sync", {
      method: "POST",
    })
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Sync failed");
        }

        console.log("LifeOS auth sync:", data);
      })
      .catch((error) => {
        console.error("LifeOS auth sync failed:", error);
      });
  }, [isLoaded, isSignedIn]);

  return null;
}