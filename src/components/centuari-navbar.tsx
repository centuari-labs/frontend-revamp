"use client";

import { usePrivy } from "@privy-io/react-auth";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Menu, Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

if (typeof window !== "undefined") {
	gsap.registerPlugin(ScrollTrigger);
}

const SCROLL_THRESHOLD = 60;

import { Input } from "@/components/ui/input";
import { CentuariButton } from "./centuari-button";

import { CentuariWithdrawDialog } from "./centuari-withdraw-dialog";
import { CentuariDepositDialog } from "./centuari-deposit-dialog";
import { CentuariLoginDialog } from "./centuari-login-dialog";
import { CentuariUserMenu } from "./centuari-user-menu";
import { isPathActive, isMacPlatform } from "@/lib/utils";
import { glassStyle } from "@/components/ui/glass-card";
import { CentuariGlassLayers } from "./centuari-glass-surface";
import { IS_FAUCET_ENABLED } from "@/lib/faucet-config";

interface NavItem {
	name: string;
	href: string;
}

const NAV_PATH_ALIASES: Record<string, string[]> = {
	"/": ["/", "/market"],
	"/portfolio": ["/portfolio", "/portfolio/transaction-history"],
	"/faucet": ["/faucet"],
};

const NAV_ITEMS: readonly NavItem[] = [
	{ name: "Earn & Borrow", href: "/" },
	{ name: "Portfolio", href: "/portfolio" },
	...(IS_FAUCET_ENABLED ? [{ name: "Faucet", href: "/faucet" }] : []),
	// { name: "Points", href: "/points" },
] as const;

export default function CentuariNavbar() {
	const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
	const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
	const [isLoginDialogOpen, setIsLoginDialogOpen] = useState<boolean>(false);

	const pathname = usePathname();

	const { authenticated } = usePrivy();

	const navRef = useRef<HTMLElement>(null);
	const pillRef = useRef<HTMLDivElement>(null);
	const innerRef = useRef<HTMLDivElement>(null);
	const mobileMenuRef = useRef<HTMLDivElement>(null);
	const mobileSearchRef = useRef<HTMLDivElement>(null);
	const navItemsRef = useRef<(HTMLAnchorElement | null)[]>([]);
	const desktopNavRef = useRef<(HTMLAnchorElement | null)[]>([]);
	const indicatorRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	// GSAP-driven smart navbar — width-shrink to centered pill on scroll.
	useEffect(() => {
		const nav = navRef.current;
		const pill = pillRef.current;
		const inner = innerRef.current;
		if (!nav || !pill || !inner) return;

		const ctx = gsap.context(() => {
			const isDesktop = window.matchMedia("(min-width: 768px)").matches;
			// Initial — full width hero state
			const initialMaxW = "100%";
			const initialPadX = isDesktop ? 42 : 16;
			const initialPadY = isDesktop ? 2 : 2;
			const initialInnerH = isDesktop ? 80 : 64;
			const initialRadius = 0;
			const _initialMarginTop = 0;
			// Scrolled — centered floating pill
			const scrolledMaxW = isDesktop ? "880px" : "calc(100% - 24px)";
			const scrolledPadX = isDesktop ? 16 : 12;
			const scrolledPadY = isDesktop ? 6 : 4;
			const scrolledInnerH = isDesktop ? 56 : 48;
			const scrolledRadius = 10;
			const scrolledMarginTop = isDesktop ? 12 : 8;

			gsap.set(nav, {
				willChange: "transform",
			});
			gsap.set(pill, {
				maxWidth: initialMaxW,
				// marginTop: initialMarginTop,
				paddingLeft: initialPadX,
				paddingRight: initialPadX,
				paddingTop: initialPadY,
				paddingBottom: initialPadY,
				borderRadius: initialRadius,
				willChange:
					"max-width, margin, padding, border-radius, background-color, backdrop-filter",
			});
			gsap.set(inner, {
				height: initialInnerH,
				willChange: "height",
			});

			// 1. Mount intro — fade + slide down.
			gsap.from(nav, {
				y: -24,
				opacity: 0,
				duration: 0.7,
				ease: "expo.out",
			});

			// 2. Scrolled state — width shrink + pill + glass.
			const scrolledTl = gsap
				.timeline({
					paused: true,
					defaults: { ease: "power2.out", duration: 0.45 },
				})
				.to(
					pill,
					{
						maxWidth: scrolledMaxW,
						marginTop: scrolledMarginTop,
						paddingLeft: scrolledPadX,
						paddingRight: scrolledPadX,
						paddingTop: scrolledPadY,
						paddingBottom: scrolledPadY,
						borderRadius: scrolledRadius,
						backgroundColor: "rgba(8, 10, 18, 0.6)",
						backdropFilter: "blur(20px) saturate(160%)",
						borderColor: "rgba(255, 255, 255, 0.08)",
						boxShadow: "0 12px 40px -10px rgba(0,0,0,0.55)",
					},
					0,
				)
				.to(inner, { height: scrolledInnerH }, 0);

			ScrollTrigger.create({
				start: 0,
				end: 99999,
				onUpdate: (self) => {
					if (self.scroll() > SCROLL_THRESHOLD) scrolledTl.play();
					else scrolledTl.reverse();
				},
			});

			// 3. Smart hide — scroll down hides, scroll up reveals.
			// let lastY = 0;
			// ScrollTrigger.create({
			//   start: 0,
			//   end: 99999,
			//   onUpdate: (self) => {
			//     const y = self.scroll();
			//     const delta = y - lastY;
			//     lastY = y;

			//     if (y < SCROLL_THRESHOLD) {
			//       gsap.to(nav, {
			//         yPercent: 0,
			//         duration: 0.3,
			//         ease: "power2.out",
			//         overwrite: "auto",
			//       });
			//       return;
			//     }

			//     if (delta > 4) {
			//       gsap.to(nav, {
			//         yPercent: -130,
			//         duration: 0.4,
			//         ease: "power2.in",
			//         overwrite: "auto",
			//       });
			//     } else if (delta < -4) {
			//       gsap.to(nav, {
			//         yPercent: 0,
			//         duration: 0.4,
			//         ease: "power2.out",
			//         overwrite: "auto",
			//       });
			//     }
			//   },
			// });
		}, nav);

		return () => ctx.revert();
	}, []);

	const isNavItemActive = (item: NavItem): boolean =>
		isPathActive(pathname, item.href, NAV_PATH_ALIASES);

	useEffect(() => {
		const updateIndicator = () => {
			if (!indicatorRef.current) return;
			const activeIndex = NAV_ITEMS.findIndex((item) => isNavItemActive(item));
			const activeElement = desktopNavRef.current[activeIndex];

			if (activeElement) {
				const { offsetLeft, offsetWidth } = activeElement;
				gsap.to(indicatorRef.current, {
					x: offsetLeft,
					width: offsetWidth,
					opacity: 1,
					duration: 0.4,
					ease: "power3.out",
				});
			} else {
				gsap.to(indicatorRef.current, {
					opacity: 0,
					duration: 0.2,
					ease: "power2.in",
				});
			}
		};

		const raf = requestAnimationFrame(updateIndicator);
		window.addEventListener("resize", updateIndicator);
		return () => {
			cancelAnimationFrame(raf);
			window.removeEventListener("resize", updateIndicator);
		};
		// biome-ignore lint/correctness/useExhaustiveDependencies: isNavItemActive closes over pathname; effect re-runs on nav changes
	}, [isNavItemActive]);

	useEffect(() => {
		if (!mobileMenuRef.current) return;

		if (isMenuOpen) {
			gsap.fromTo(
				mobileMenuRef.current,
				{ height: 0, opacity: 0 },
				{ height: "auto", opacity: 1, duration: 0.3, ease: "power2.out" },
			);
			const items = navItemsRef.current.filter(
				(item): item is HTMLAnchorElement => item !== null,
			);
			gsap.fromTo(
				items,
				{ x: -20, opacity: 0 },
				{
					x: 0,
					opacity: 1,
					duration: 0.3,
					stagger: 0.1,
					ease: "power2.out",
					delay: 0.1,
				},
			);
		} else {
			gsap.to(mobileMenuRef.current, {
				height: 0,
				opacity: 0,
				duration: 0.2,
				ease: "power2.in",
			});
		}
	}, [isMenuOpen]);

	useEffect(() => {
		if (!mobileSearchRef.current) return;

		if (isSearchOpen) {
			gsap.fromTo(
				mobileSearchRef.current,
				{ height: 0, opacity: 0, y: -10 },
				{
					height: "auto",
					opacity: 1,
					y: 0,
					duration: 0.3,
					ease: "power2.out",
				},
			);
		} else {
			gsap.to(mobileSearchRef.current, {
				height: 0,
				opacity: 0,
				y: -10,
				duration: 0.2,
				ease: "power2.in",
			});
		}
	}, [isSearchOpen]);

	const handleNavClick = (): void => {
		setIsMenuOpen(false);
	};

	const handleConnectWalletClick = (e: React.MouseEvent): void => {
		e.stopPropagation();
		e.preventDefault();
		setIsMenuOpen(false);
	};

	const toggleMenu = (): void => setIsMenuOpen((prev) => !prev);
	const toggleSearch = (): void => setIsSearchOpen((prev) => !prev);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (!event.key) return;
			const key = event.key.toLowerCase();
			const hotkey =
				(isMacPlatform() ? event.metaKey : event.ctrlKey) && key === "k";

			if (hotkey && inputRef.current) {
				event.preventDefault();
				inputRef.current.focus();
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, []);

	return (
		<nav
			ref={navRef}
			id="tour-home-nav"
			className="fixed top-0 left-0 right-0 z-[100] translate-z-0 backface-hidden pointer-events-none"
		>
			<div
				ref={pillRef}
				className="mx-auto w-full border border-transparent pointer-events-auto"
				style={{
					backgroundColor: "rgba(8, 10, 18, 0)",
					backdropFilter: "blur(0px)",
				}}
			>
				<div>
					<div ref={innerRef} className="flex items-center justify-between">
						<Link href="/" className="flex items-center gap-2">
							<img
								src="/centuari-logo.png"
								alt="Centuari"
								className="w-6 h-6 md:w-8 md:h-8"
							/>
							<span className="text-white font-medium text-base md:text-lg hidden sm:inline">
								Centuari
							</span>
						</Link>

						<div className="group/glass relative isolate hidden md:flex items-center gap-1 overflow-hidden bg-transparent p-1.5 rounded-lg md:rounded-xl">
							<CentuariGlassLayers intensity="soft" sheen={false} />

							<div
								ref={indicatorRef}
								aria-hidden
								className="absolute inset-y-1.5 left-0 rounded-lg backdrop-blur-xl pointer-events-none overflow-hidden"
								style={{
									width: 0,
									opacity: 0,
									...glassStyle,
									boxShadow: [
										"inset 0 1px 0 0 rgba(255,255,255,0.35)",
										"inset 0 -1px 0 0 rgba(255,255,255,0.08)",
										"0 6px 14px -4px rgba(0,0,0,0.35)",
									].join(", "),
								}}
							>
								<div
									className="absolute inset-0 rounded-[inherit] pointer-events-none"
									style={{
										padding: "1px",
										background:
											"linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.10) 45%, rgba(255,255,255,0.06) 70%, rgba(255,255,255,0.25) 100%)",
										mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
										maskComposite: "exclude",
										WebkitMask:
											"linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
										WebkitMaskComposite: "xor",
									}}
								/>
							</div>

							{NAV_ITEMS.map((item, index) => (
								<Link
									key={item.name}
									href={item.href}
									ref={(el) => {
										desktopNavRef.current[index] = el;
									}}
									className={`relative z-10 px-2 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
										isNavItemActive(item)
											? "text-white font-semibold"
											: "text-white/70 hover:text-white"
									}`}
								>
									{item.name}
								</Link>
							))}
						</div>

						<div className="hidden md:flex items-center gap-3">
							{/* <div className="relative group">
                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40 transition-colors group-focus-within:text-primary" />
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Search assets"
                  className="pl-11 pr-20 w-72 h-11 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:border-primary/50 transition-all duration-200"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                  <kbd className="px-2 py-1 text-xs bg-white/5 border border-white/10 rounded text-white/60 transition-colors group-focus-within:border-primary/30">
                    ⌘
                  </kbd>
                  <kbd className="px-2 py-1 text-xs bg-white/5 border border-white/10 rounded text-white/60 transition-colors group-focus-within:border-primary/30">
                    K
                  </kbd>
                </div>
              </div> */}
							{/* {authenticated && (
                <div className="border border-white/10 h-4 border-r-[0.5px]"></div>
              )} */}
							{authenticated ? <CentuariDepositDialog /> : null}
							{authenticated && <CentuariWithdrawDialog />}
							{authenticated && (
								<div className="border border-white/10 h-4 border-r-[0.5px]"></div>
							)}

							{authenticated ? (
								<CentuariUserMenu />
							) : (
								<CentuariLoginDialog
									open={isLoginDialogOpen}
									onOpenChange={setIsLoginDialogOpen}
								/>
							)}
						</div>

						<div className="flex md:hidden items-center gap-2">
							<button
								type="button"
								onClick={toggleSearch}
								className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-all duration-200"
								aria-label="Toggle search"
								aria-expanded={isSearchOpen}
							>
								<Search className="w-5 h-5" />
							</button>
							<button
								type="button"
								onClick={toggleMenu}
								className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-all duration-200"
								aria-label="Toggle menu"
								aria-expanded={isMenuOpen}
							>
								{isMenuOpen ? (
									<X className="w-5 h-5" />
								) : (
									<Menu className="w-5 h-5" />
								)}
							</button>
						</div>
					</div>

					{isSearchOpen && (
						<div
							ref={mobileSearchRef}
							className="md:hidden pb-4 overflow-hidden"
						>
							<div className="relative">
								<Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
								<Input
									type="text"
									placeholder="Search assets"
									className="pl-11 w-full h-11 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:border-primary/50"
								/>
							</div>
						</div>
					)}
				</div>

				{isMenuOpen && (
					<div
						ref={mobileMenuRef}
						className="md:hidden z-50 rounded-b-2xl border-white/10 overflow-hidden bg-primary-blue-100 border"
					>
						<div className="px-4 pt-3 pb-4 space-y-2">
							{NAV_ITEMS.map((item, index) => (
								<Link
									key={item.name}
									href={item.href}
									ref={(el) => {
										navItemsRef.current[index] = el;
									}}
									onClick={handleNavClick}
									className={`block w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
										isNavItemActive(item)
											? "text-white bg-white/10"
											: "text-white/70 hover:text-white hover:bg-white/5"
									}`}
								>
									{item.name}
								</Link>
							))}
							<div className="pt-2">
								{authenticated ? (
									<CentuariUserMenu />
								) : (
									<a href="#login" className="block">
										<CentuariButton
											variant="primary"
											className="w-full"
											onClick={(e) => {
												handleConnectWalletClick(e);
												setIsLoginDialogOpen(true);
											}}
										>
											Login
										</CentuariButton>
									</a>
								)}
							</div>
						</div>
					</div>
				)}
			</div>
		</nav>
	);
}
