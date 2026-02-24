"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import {
  ChevronDown,
  Copy,
  ExternalLink,
  Link2,
  LogOut,
  ArrowLeft,
  Loader2,
  Pencil,
  Plus,
} from "lucide-react";
import { useCallback, useEffect, useId, useState } from "react";
import { updateAccountName } from "@/lib/api";
import { useDisconnect, useBalance, useConnection } from "wagmi";
import { formatUnits } from "viem";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { CentuariButton } from "./centuari-button";
import { CentuariInput } from "./centuari-input";
import { formatAddress } from "@/lib/utils";

const LS_USERNAME_KEY = "centuari_username";

function getStoredUsername(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(LS_USERNAME_KEY) ?? "";
}

function getUserInitial(user: ReturnType<typeof usePrivy>["user"]): string {
  const stored = getStoredUsername();
  if (stored) return stored[0].toUpperCase();

  const email = user?.email?.address;
  if (email) return email[0].toUpperCase();

  const google = user?.google?.name;
  if (google) return google[0].toUpperCase();

  const twitter = user?.twitter?.name;
  if (twitter) return twitter[0].toUpperCase();

  return "U";
}

function getDefaultUsername(
  user: ReturnType<typeof usePrivy>["user"]
): string {
  const email = user?.email?.address;
  if (email) return email.split("@")[0];

  const google = user?.google?.name;
  if (google) return google;

  const twitter = user?.twitter?.name;
  if (twitter) return twitter;

  return "User";
}

export function CentuariUserMenu() {
  const id = useId();
  const { user, logout, getAccessToken } = usePrivy();
  const { disconnect } = useDisconnect();
  const { wallets } = useWallets();
  const { address: wagmiAddress } = useConnection();

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"main" | "edit-username">("main");
  const [username, setUsername] = useState("");
  const [editValue, setEditValue] = useState("");
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  // Derive wallet address: prefer embedded wallet, fallback to wagmi
  const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");
  const walletAddress =
    embeddedWallet?.address ?? wagmiAddress ?? "";

  const { data: balanceData } = useBalance({
    address: walletAddress as `0x${string}` | undefined,
  });

  // Load username from localStorage on mount
  useEffect(() => {
    const stored = getStoredUsername();
    if (stored) {
      setUsername(stored);
    } else {
      const fallback = getDefaultUsername(user);
      setUsername(fallback);
    }
  }, [user]);

  // Reset view when popover closes
  useEffect(() => {
    if (!open) {
      setView("main");
    }
  }, [open]);

  const handleCopyAddress = useCallback(() => {
    if (!walletAddress) return;
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [walletAddress]);

  const handleSaveUsername = useCallback(async () => {
    const trimmed = editValue.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      const token = await getAccessToken();
      if (token) {
        await updateAccountName(trimmed, token);
      }
      localStorage.setItem(LS_USERNAME_KEY, trimmed);
      window.dispatchEvent(new Event("centuari_username_changed"));
      setUsername(trimmed);
      setView("main");
    } catch (err) {
      console.error("Failed to update name:", err);
    } finally {
      setSaving(false);
    }
  }, [editValue, getAccessToken]);

  const handleLogout = useCallback(() => {
    setOpen(false);
    logout();
    disconnect();
    localStorage.removeItem(LS_USERNAME_KEY);
  }, [logout, disconnect]);

  const formattedBalance = balanceData
    ? `${Number(formatUnits(balanceData.value, balanceData.decimals)).toFixed(4)} ${balanceData.symbol}`
    : "0 ETH";

  const initial = getUserInitial(user);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 hover:bg-white/10 transition-colors cursor-pointer"
        >
          <div className="w-7 h-7 rounded-full bg-primary-blue-base/60 flex items-center justify-center text-white text-sm font-semibold">
            {initial}
          </div>
          <ChevronDown className="w-4 h-4 text-white/60" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-72 p-0 bg-[#0a0e1a] border border-white/10 rounded-xl shadow-2xl"
      >
        {view === "main" ? (
          <div className="flex flex-col">
            {/* Header: Username + Wallet */}
            <div className="px-4 pt-4 pb-3">
              <div className="flex items-center gap-2">
                <p className="text-white text-sm font-medium truncate">
                  {username}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEditValue(username);
                    setView("edit-username");
                  }}
                  className="text-white/40 hover:text-white transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
              {walletAddress && (
                <p className="text-white/40 text-xs mt-0.5">
                  Wallet: {formatAddress(walletAddress)}
                </p>
              )}
            </div>

            {/* Wallet Card */}
            {walletAddress && (
              <div className="mx-4 mb-3 rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/60 text-xs">
                    {formatAddress(walletAddress, 6)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleCopyAddress}
                      className="text-white/40 hover:text-white transition-colors"
                      title="Copy address"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <a
                      href={`https://etherscan.io/address/${walletAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/40 hover:text-white transition-colors"
                      title="View on explorer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      type="button"
                      className="text-white/40 hover:text-white transition-colors"
                      title="Add wallet"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-white text-sm font-medium">
                  {formattedBalance}
                </p>
                {copied && (
                  <p className="text-green-400 text-xs mt-1">Copied!</p>
                )}
              </div>
            )}

            {/* Menu Items */}
            <div className="border-t border-white/10">
              <button
                type="button"
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors"
              >
                <Link2 className="w-4 h-4" />
                Linked Account
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-white/5 hover:text-red-300 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        ) : (
          /* Edit Username View */
          <div className="flex flex-col p-4">
            <button
              type="button"
              onClick={() => setView("main")}
              className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors mb-4 w-fit"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back</span>
            </button>

            <CentuariInput
              id={`${id}-username`}
              size="medium"
              label="Username"
              placeholder="Enter username"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveUsername();
              }}
            />

            <CentuariButton
              variant="primary"
              className="w-full mt-4"
              onClick={handleSaveUsername}
              disabled={!editValue.trim() || saving}
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving…
                </span>
              ) : (
                "Save Changes"
              )}
            </CentuariButton>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
