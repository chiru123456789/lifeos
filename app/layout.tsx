import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import Sidebar from "@/components/sidebar";
import AuthHeader from "@/components/auth-header";
import AuthSync from "@/components/auth-sync";

export const metadata: Metadata = {
  title: "LifeOS",
  description: "Your personal operating system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="bg-slate-950 text-white antialiased">
          <div className="flex min-h-screen">
            <Sidebar />

            <main className="min-w-0 flex-1">
              <div className="fixed right-5 top-5 z-50 flex items-center gap-2">
                <AuthHeader />
              </div>

              <AuthSync />

              {children}
            </main>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}