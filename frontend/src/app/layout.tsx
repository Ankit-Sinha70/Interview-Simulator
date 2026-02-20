
import type { Metadata } from "next";

import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";



export const metadata: Metadata = {
  title: "AI Interview Simulator",
  description: "Practice technical interviews with AI-powered adaptive questioning, real-time evaluation, and comprehensive feedback reports.",
};

import ClientLayout from "@/components/ClientLayout";

// ...

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <AuthProvider>
          <ClientLayout>
            <div className="relative z-[1] min-h-screen">
              {children}
            </div>
          </ClientLayout>
          <Toaster richColors position="top-center" />
        </AuthProvider>
      </body>
    </html>
  );
}

