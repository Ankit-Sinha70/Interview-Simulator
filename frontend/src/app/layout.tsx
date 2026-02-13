
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Interview Simulator",
  description: "Practice technical interviews with AI-powered adaptive questioning, real-time evaluation, and comprehensive feedback reports.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>
          <div className="relative z-[1] min-h-screen">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
