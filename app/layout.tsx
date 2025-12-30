// ============================================================================
// ### IMPORTS ###
// ============================================================================
import type { Metadata } from "next";

// ============================================================================
// ### COMPONENTS ###
// ============================================================================
import { ConvexClientProvider } from "./ConvexClientProvider";

// ============================================================================
// ### ASSETS ###
// ============================================================================
import "./globals.css";

// ============================================================================
// ### CONFIGURATIONS ###
// ============================================================================
export const metadata: Metadata = {
	title: "NoCode Builder - Build Anything with AI",
	description:
		"Describe what you want to build and watch AI create it in real-time. No coding required.",
	keywords: ["no-code", "AI", "builder", "website", "app", "generator"],
};

// ============================================================================
// ### CUSTOM ###
// ============================================================================
export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" className="dark">
			<head>
				<link rel="icon" href="/favicon.ico" />
			</head>
			<body className="font-body antialiased">
				<ConvexClientProvider>{children}</ConvexClientProvider>
			</body>
		</html>
	);
}
