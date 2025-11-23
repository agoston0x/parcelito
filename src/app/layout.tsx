import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import MiniKitProvider from "@/components/MiniKitProvider";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Parcelito",
  description: "Token baskets for everyone",
  icons: {
    icon: "/parcelito.png",
    apple: "/parcelito.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${nunito.variable} antialiased`}>
        <MiniKitProvider>{children}</MiniKitProvider>
      </body>
    </html>
  );
}
