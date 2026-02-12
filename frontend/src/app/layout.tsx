import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="relative z-[1] min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
