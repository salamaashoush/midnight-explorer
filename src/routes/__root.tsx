import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Link,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { Moon } from "lucide-react";
import { SearchBox } from "../components/search-box";
import { TooltipProvider } from "../components/ui/tooltip";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import { NETWORK } from "../lib/indexer";
import appCss from "../styles.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: "Midnight Explorer" },
			{
				name: "description",
				content: `Block & transaction explorer for the Midnight ${NETWORK} network.`,
			},
		],
		links: [{ rel: "stylesheet", href: appCss }],
	}),
	shellComponent: RootDocument,
});

function NavItem({ to, children }: { to: string; children: React.ReactNode }) {
	return (
		<Link
			to={to}
			activeOptions={{ exact: to === "/" }}
			className="rounded-md px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
			activeProps={{ className: "bg-muted text-foreground" }}
		>
			{children}
		</Link>
	);
}

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" className="dark">
			<head>
				<HeadContent />
			</head>
			<body className="min-h-screen bg-background text-foreground antialiased">
				<TooltipProvider delayDuration={200}>
					<header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
						<div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
							<Link to="/" className="flex shrink-0 items-center gap-2">
								<span className="grid size-7 place-items-center rounded-md bg-primary/15 text-primary">
									<Moon className="size-4" />
								</span>
								<span className="text-base font-semibold tracking-tight">
									Midnight Explorer
								</span>
								<span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
									{NETWORK}
								</span>
							</Link>
							<nav className="flex items-center gap-1">
								<NavItem to="/">Blocks</NavItem>
								<NavItem to="/network">Network</NavItem>
							</nav>
							<div className="sm:ml-auto sm:max-w-xl sm:flex-1">
								<SearchBox />
							</div>
						</div>
					</header>

					<main className="mx-auto max-w-6xl px-4 py-8">{children}</main>

					<footer className="mx-auto max-w-6xl px-4 pb-10 text-xs text-muted-foreground">
						Data from the Midnight {NETWORK} indexer. Shielded transaction
						sender / receiver / amounts are private by design and not shown.
					</footer>
				</TooltipProvider>

				<TanStackDevtools
					config={{ position: "bottom-right" }}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
						TanStackQueryDevtools,
					]}
				/>
				<Scripts />
			</body>
		</html>
	);
}
