import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Major Incident Flip Deck",
  description: "Interactive flip deck for major incident response leadership."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#content">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
