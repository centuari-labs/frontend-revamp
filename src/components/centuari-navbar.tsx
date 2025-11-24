"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import gsap from "gsap";
import { CentuariButton } from "./centuari-button";
import { CentuariConnectWallet } from "./centuari-connect-wallet";

interface NavItem {
  name: string;
  href: string;
}

const NAV_ITEMS: readonly NavItem[] = [
  { name: "Earn & Borrow", href: "#earn" },
  { name: "Portfolio", href: "#portfolio" },
  { name: "Points", href: "#points" },
] as const;

export default function CentuariNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [activeItem, setActiveItem] = useState<string>("Earn & Borrow");

  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const navItemsRef = useRef<(HTMLAnchorElement | null)[]>([]);
  const desktopNavRef = useRef<(HTMLAnchorElement | null)[]>([]);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const updateIndicator = () => {
      const activeIndex = NAV_ITEMS.findIndex(
        (item) => item.name === activeItem
      );
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
  }, [activeItem]);

  // GSAP Animation for mobile menu
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

  const handleNavClick = (itemName: string): void => {
    setActiveItem(itemName);
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
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="max-w-[1440px] mx-auto w-full">
        <div className="px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-5 md:bg-white/5 px-4 py-1.5 rounded-xl border border-white/5">
              <img src="/centuari-logo.png" alt="Logo" className="w-8 h-8" />

              <div className="hidden md:flex items-center space-x-1 relative">
                <div
                  ref={indicatorRef}
                  className="absolute h-10 bg-white/5 rounded-lg transition-colors pointer-events-none"
                  style={{
                    left: 0,
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 0,
                  }}
                />

                {NAV_ITEMS.map((item, index) => (
                  <a
                    key={item.name}
                    href={item.href}
                    ref={(el) => {
                      desktopNavRef.current[index] = el;
                    }}
                    onClick={() => setActiveItem(item.name)}
                    className={`relative z-10 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      activeItem === item.name
                        ? "text-white font-semibold"
                        : "text-white hover:text-white"
                    }`}
                    onMouseEnter={(e) => {
                      if (activeItem !== item.name) {
                        gsap.to(e.currentTarget, {
                          y: -2,
                          duration: 0.18,
                          ease: "power2.out",
                        });
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeItem !== item.name) {
                        gsap.to(e.currentTarget, {
                          y: 0,
                          duration: 0.18,
                          ease: "power2.out",
                        });
                      }
                    }}
                  >
                    {item.name}
                  </a>
                ))}
              </div>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors group-focus-within:text-blue-400" />
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Search assets"
                  className="pl-10 pr-20 w-64 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-slate-600 focus-visible:border-blue-500 transition-all duration-200"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 text-xs bg-slate-800 border border-slate-700 rounded text-slate-400 transition-colors group-focus-within:border-primary-blue-20">
                    ⌘
                  </kbd>
                  <kbd className="px-1.5 py-0.5 text-xs bg-slate-800 border border-slate-700 rounded text-slate-400 transition-colors group-focus-within:border-primary-blue-20">
                    K
                  </kbd>
                </div>
              </div>

              <CentuariConnectWallet />
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden items-center gap-2">
              <button
                onClick={toggleSearch}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all duration-200"
                aria-label="Toggle search"
                aria-expanded={isSearchOpen}
              >
                <Search className="w-5 h-5" />
              </button>
              <button
                onClick={toggleMenu}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all duration-200"
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

          {/* Mobile Search Bar */}
          {isSearchOpen && (
            <div
              ref={mobileSearchRef}
              className="md:hidden pb-4 overflow-hidden"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search assets"
                  className="pl-10 w-full bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-slate-600 focus-visible:border-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {isMenuOpen && (
          <div
            ref={mobileMenuRef}
            className="md:hidden border-t border-slate-800 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-3 space-y-1">
              {NAV_ITEMS.map((item, index) => (
                <a
                  key={item.name}
                  href={item.href}
                  ref={(el) => {navItemsRef.current[index] = el}}
                  onClick={() => handleNavClick(item.name)}
                  className={`block w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeItem === item.name
                      ? "text-white bg-slate-800"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                  }`}
                >
                  {item.name}
                </a>
              ))}
              <div className="pt-2">
                <a href="#login" className="block">
                  {/* <Button variant={"primary"} className="w-full relative">
                    <div className="absolute inset-x-0 h-px w-1/2 mx-auto top-0 shadow-2xl bg-gradient-to-r from-transparent via-white/50 to-transparent" />
                    Login to Centuari
                  </Button> */}
                  <CentuariButton variant="primary" className="w-full">
                    Login to Centuari
                  </CentuariButton>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
