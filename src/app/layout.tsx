import type { Metadata } from "next";
import "./globals.css";
import CentuariNavbar from "@/components/centuari-navbar";
import { Provider } from "@/components/provider";
import { ThemeProvider } from "@/components/theme-provider";
import { switzer } from "@/components/ui/fonts";
import { TourProvider } from "@/components/product-tour/tour-context";
import { AccessCodeGate } from "@/components/access-code-gate";
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
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${switzer.variable} relative font-mono antialiased bg-black`}
				suppressHydrationWarning
				suppressContentEditableWarning
			>
				<div
					className="fixed inset-0"
					style={{
						backgroundImage: 'url("/bg-centuari.webp")',
						backgroundRepeat: "no-repeat",
						backgroundSize: "cover",
						backgroundPosition: "center",
					}}
				/>
				<div className="fixed inset-0 -z-10 bg-black" />

				<main className="mx-auto max-w-full py-2.5 text-foreground min-h-screen">
					<ThemeProvider
						attribute="class"
						defaultTheme="dark"
						enableSystem
						disableTransitionOnChange
					>
						<Provider>
							<AccessCodeGate>
								<TourProvider>
									<CentuariNavbar />
									{children}
									<Toaster theme="dark" position="bottom-right" richColors />
								</TourProvider>
							</AccessCodeGate>
						</Provider>
					</ThemeProvider>
				</main>
			</body>
		</html>
	);
}
