import type { Metadata } from "next";
import "./globals.css";
import CentuariNavbar from "@/components/centuari-navbar";
import { Provider } from "@/components/provider";
import { ThemeProvider } from "@/components/theme-provider";
import { switzer } from "@/components/ui/fonts";
import { TourProvider } from "@/components/product-tour/tour-context";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Centuari",
  description: "Fixed rate CLOB lending protocol",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${switzer.variable} relative font-mono antialiased bg-black`}
        suppressHydrationWarning
        suppressContentEditableWarning
      >
        <main
          className="mx-auto max-w-full py-2.5 text-foreground min-h-screen"
          style={{
            backgroundImage: 'url("/bg-centuari.webp")',
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="fixed inset-0 -z-10 bg-black" />
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <Provider>
              <TourProvider>
                <CentuariNavbar />
                {children}
                <Toaster theme="dark" position="bottom-right" richColors />
              </TourProvider>
            </Provider>
          </ThemeProvider>
        </main>
      </body>
    </html>
  );
}
