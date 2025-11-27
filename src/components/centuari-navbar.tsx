"use client";

import { usePrivy } from "@privy-io/react-auth";
import gsap from "gsap";
import { Menu, Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useDisconnect } from "wagmi";
import { Input } from "@/components/ui/input";
import { CentuariButton } from "./centuari-button";
import { CentuariConnectWallet } from "./centuari-connect-wallet";

interface NavItem {
  name: string;
  href: string;
}

const NAV_ITEMS: readonly NavItem[] = [
  { name: "Home", href: "/" },
  { name: "Earn & Borrow", href: "/market" },
  { name: "Portfolio", href: "/portfolio" },
  { name: "Points", href: "/points" },
] as const;

export default function CentuariNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isScrolled, setIsScrolled] = useState<boolean>(false);

  const pathname = usePathname();

  const { authenticated, logout } = usePrivy();
  const { disconnect } = useDisconnect();

  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const navItemsRef = useRef<(HTMLAnchorElement | null)[]>([]);
  const desktopNavRef = useRef<(HTMLAnchorElement | null)[]>([]);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const updateIndicator = () => {
      const activeIndex = NAV_ITEMS.findIndex((item) => item.href === pathname);
      const activeElement = desktopNavRef.current[activeIndex];

      if (activeElement && indicatorRef.current) {
        const { offsetLeft, offsetWidth } = activeElement;

        gsap.to(indicatorRef.current, {
          x: offsetLeft,
          width: offsetWidth,
          duration: 0.4,
          ease: "power2.out",
        });
      } else if (indicatorRef.current) {
        gsap.to(indicatorRef.current, {
          x: 0,
          width: 0,
          duration: 0.2,
          ease: "power2.in",
        });
      }
    };

    updateIndicator();
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuRef.current) return;

    if (isMenuOpen) {
      gsap.fromTo(
        mobileMenuRef.current,
        { height: 0, opacity: 0 },
        { height: "auto", opacity: 1, duration: 0.3, ease: "power2.out" }
      );
      const items = navItemsRef.current.filter(
        (item): item is HTMLAnchorElement => item !== null
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
        }
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
        }
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

  const toggleMenu = (): void => setIsMenuOpen((prev) => !prev);
  const toggleSearch = (): void => setIsSearchOpen((prev) => !prev);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform);
      const key = event.key.toLowerCase();
      const hotkey = (isMac ? event.metaKey : event.ctrlKey) && key === "k";

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
      className={`fixed flex items-center top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-white/5 h-16 backdrop-blur-xl" : ""
      }`}
    >
      <div className="max-w-6xl xl:max-w-[88rem] 2xl:max-w-[140rem] mx-auto w-full">
        <div className="px-4 md:px-6">
          <div className="flex items-center justify-between md:h-20">
            <div className="flex items-center gap-6 bg-black/5 px-5 py-1 rounded-xl border border-white/10 backdrop-blur-sm">
              <img src="/centuari-logo.png" alt="Logo" className="w-8 h-8" />

              <div className="hidden md:flex items-center space-x-2 relative">
                <div
                  ref={indicatorRef}
                  className="absolute h-10 bg-white/10 rounded-lg transition-colors pointer-events-none"
                  style={{
                    left: 0,
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 0,
                  }}
                />

                {NAV_ITEMS.map((item, index) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    ref={(el) => {
                      desktopNavRef.current[index] = el;
                    }}
                    className={`relative z-10 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      pathname === item.href
                        ? "text-white font-semibold"
                        : "text-white/70 hover:text-white"
                    }`}
                    onMouseEnter={(e) => {
                      if (pathname !== item.href) {
                        gsap.to(e.currentTarget, {
                          y: -2,
                          duration: 0.18,
                          ease: "power2.out",
                        });
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (pathname !== item.href) {
                        gsap.to(e.currentTarget, {
                          y: 0,
                          duration: 0.18,
                          ease: "power2.out",
                        });
                      }
                    }}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <div className="relative group">
                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40 transition-colors group-focus-within:text-primary" />
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Search assets"
                  className="pl-11 pr-20 w-72 h-11 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:border-primary/50 transition-all duration-200 backdrop-blur-sm"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                  <kbd className="px-2 py-1 text-xs bg-white/5 border border-white/10 rounded text-white/60 transition-colors group-focus-within:border-primary/30">
                    ⌘
                  </kbd>
                  <kbd className="px-2 py-1 text-xs bg-white/5 border border-white/10 rounded text-white/60 transition-colors group-focus-within:border-primary/30">
                    K
                  </kbd>
                </div>
              </div>

              {authenticated ? (
                <CentuariButton
                  variant="primary"
                  onClick={() => {
                    logout();
                    disconnect();
                  }}
                >
                  Logout
                </CentuariButton>
              ) : (
                <CentuariConnectWallet />
              )}
            </div>

            <div className="flex md:hidden items-center gap-2">
              <button
                type="button"
                onClick={toggleSearch}
                className="p-2.5 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-all duration-200"
                aria-label="Toggle search"
                aria-expanded={isSearchOpen}
              >
                <Search className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={toggleMenu}
                className="p-2.5 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-all duration-200"
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
            className="md:hidden border-t border-white/10 overflow-hidden bg-background/95 backdrop-blur-xl"
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
                    pathname === item.href
                      ? "text-white bg-white/10"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              <div className="pt-2">
                <a href="#login" className="block">
                  {authenticated ? (
                    <CentuariButton
                      variant="primary"
                      onClick={() => {
                        logout();
                        disconnect();
                      }}
                    >
                      Logout
                    </CentuariButton>
                  ) : (
                    <CentuariConnectWallet />
                  )}
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
