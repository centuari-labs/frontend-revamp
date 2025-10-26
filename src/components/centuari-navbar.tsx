"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import gsap from "gsap";

export default function CentuariNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeItem, setActiveItem] = useState("Earn & Borrow");

  const mobileMenuRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const navItemsRef = useRef<any[]>([]);
  const desktopNavRef = useRef<any>([]);
  const indicatorRef = useRef(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const navItems = [
    { name: "Earn & Borrow", href: "#earn" },
    { name: "Portfolio", href: "#portfolio" },
    { name: "Points", href: "#points" },
  ];

  useEffect(() => {
    const activeIndex = navItems.findIndex((item) => item.name === activeItem);
    const activeElement = desktopNavRef.current[activeIndex];

    if (activeElement && indicatorRef.current) {
      const { offsetLeft, offsetWidth } = activeElement;

      gsap.to(indicatorRef.current, {
        x: offsetLeft,
        width: offsetWidth,
        duration: 0.4,
        ease: "power2.out",
      });
    }
  }, [activeItem]);

  // GSAP Animation for mobile menu
  useEffect(() => {
    if (mobileMenuRef.current) {
      if (isMenuOpen) {
        gsap.fromTo(
          mobileMenuRef.current,
          { height: 0, opacity: 0 },
          { height: "auto", opacity: 1, duration: 0.3, ease: "power2.out" }
        );
        gsap.fromTo(
          navItemsRef.current,
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
    }
  }, [isMenuOpen]);

  useEffect(() => {
    if (mobileSearchRef.current) {
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
    }
  }, [isSearchOpen]);

  const handleNavClick = (itemName: string) => {
    setActiveItem(itemName);
    setIsMenuOpen(false);
  };

  useEffect(() => {
    const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
      const isMac = /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform);
      const hotkey =
        (isMac ? event.metaKey : event.ctrlKey) && event.key === "k";

      if (hotkey && inputRef.current) {
        event.preventDefault();
        inputRef.current.focus();
      }
    };

    document.addEventListener("keydown", handleKeyPress as any);

    return () => {
      document.removeEventListener("keydown", handleKeyPress as any);
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto w-full">
      <nav className="sticky top-0 z-50 backdrop-blur-sm">
        {/* <div className="px-4 sm:px-6 lg:px-8"> */}
        <div>
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-8">
              <a href="#home" className="flex-shrink-0 group">
                <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </div>
              </a>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-1 relative">
                {/* Animated indicator background */}
                <div
                  ref={indicatorRef}
                  className="absolute h-10 bg-slate-800 rounded-lg transition-colors"
                  style={{ left: 0, top: "50%", transform: "translateY(-50%)" }}
                />

                {navItems.map((item, index) => (
                  <a
                    key={item.name}
                    href={item.href}
                    ref={(el) => {
                      desktopNavRef.current[index] = el;
                    }}
                    onClick={() => setActiveItem(item.name)}
                    className={`relative z-10 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      activeItem === item.name
                        ? "text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                    onMouseEnter={(e) => {
                      if (activeItem !== item.name) {
                        gsap.to(e.currentTarget, {
                          y: -2,
                          duration: 0.2,
                          ease: "power2.out",
                        });
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeItem !== item.name) {
                        gsap.to(e.currentTarget, {
                          y: 0,
                          duration: 0.2,
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

            {/* Right Side - Desktop */}
            <div className="hidden md:flex items-center gap-3">
              {/* Search Bar */}
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors group-focus-within:text-blue-400" />
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Search assets"
                  className="pl-10 pr-20 w-64 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-slate-600 focus-visible:border-blue-500 transition-all duration-200"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 text-xs bg-slate-800 border border-slate-700 rounded text-slate-400 transition-colors group-focus-within:border-blue-500">
                    ⌘
                  </kbd>
                  <kbd className="px-1.5 py-0.5 text-xs bg-slate-800 border border-slate-700 rounded text-slate-400 transition-colors group-focus-within:border-blue-500">
                    K
                  </kbd>
                </div>
              </div>

              {/* Login Button */}
              <a href="#login">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20">
                  Login to Centuari
                </Button>
              </a>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden items-center gap-2">
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all duration-200"
              >
                <Search className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all duration-200"
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

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div
            ref={mobileMenuRef}
            className="md:hidden border-t border-slate-800 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-3 space-y-1">
              {navItems.map((item, index) => (
                <a
                  key={item.name}
                  href={item.href}
                  ref={(el) => (navItemsRef.current[index] = el)}
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
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200">
                    Login to Centuari
                  </Button>
                </a>
              </div>
            </div>
          </div>
        )}
      </nav>
    </div>
  );
}
