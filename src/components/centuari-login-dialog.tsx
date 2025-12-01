"use client";

import {
  type BaseConnectedWalletType,
  useActiveWallet,
  useLoginWithOAuth,
  useLoginWithSiwe,
  usePrivy,
  useWallets,
} from "@privy-io/react-auth";
import { Apple, Chrome, Facebook, Instagram, Mail } from "lucide-react";
import { useEffect, useId, useState } from "react";
import {
  type Connector,
  useChainId,
  useConnect,
  useConnection,
  useConnectors,
} from "wagmi";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { CentuariButton } from "./centuari-button";
import { CentuariInput } from "./centuari-input";
import { CentuariTypography } from "./centuari-typography";
import Image from "next/image";
import { CentuariConnectWallet } from "./centuari-connect-wallet";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Email validation schema
const emailFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type EmailFormValues = z.infer<typeof emailFormSchema>;

export function CentuariLoginDialog() {
  const id = useId();
  const { connectAsync } = useConnect();
  const chainId = useChainId();
  const { setActiveWallet } = useActiveWallet();
  const { address: wagmiAddress, isConnected } = useConnection();
  const { wallets } = useWallets();
  const {
    authenticated,
    login,
    linkEmail,
    linkGoogle,
    linkApple,
    linkFarcaster,
  } = usePrivy();
  const { generateSiweMessage, loginWithSiwe } = useLoginWithSiwe();
  const [view, setView] = useState<"login" | "wallet">("login");
  const { state, loading, initOAuth } = useLoginWithOAuth();

  const connectors = useConnectors();

  // Initialize form with react-hook-form and zod validation
  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      email: "",
    },
  });

  const handleLogin = async (connector: Connector) => {
    connectAsync({ connector, chainId }).then(async (result) => {
      const activeWallet = result.accounts[0];

      const walletInPrivy = wallets.find(
        (wallet) => wallet.address === activeWallet
      );

      await setActiveWallet(walletInPrivy as BaseConnectedWalletType);

      const message = await generateSiweMessage({
        address: walletInPrivy?.address as string,
        chainId: `eip155:${chainId}`,
      });

      const signature = (await walletInPrivy?.sign(message)) as string;
      await loginWithSiwe({ signature, message });
    });
  };

  const connectPrivy = async () => {
    const walletInPrivy = wallets.find(
      (wallet) => wallet.address === wagmiAddress
    );

    if (!walletInPrivy) {
      console.error("Wallet not found in Privy wallets");
      return;
    }

    const message = await generateSiweMessage({
      address: walletInPrivy?.address as string,
      chainId: `eip155:${chainId}`,
    });

    const signature = (await walletInPrivy?.sign(message)) as string;
    await loginWithSiwe({ signature, message });
  };

  // Handle Google login
  const handleGoogleLogin = async () => {
    try {
      // The user will be redirected to OAuth provider's login page
      await initOAuth({ provider: "google" });
    } catch (err) {
      // Handle errors (network issues, validation errors, etc.)
      console.error(err);
    }
  };

  // Handle Facebook login
  const handleInstagramLogin = async () => {
    try {
      // The user will be redirected to OAuth provider's login page
      await initOAuth({ provider: "instagram" });
    } catch (err) {
      // Handle errors (network issues, validation errors, etc.)
      console.error(err);
    }
  };

  // Handle Apple login
  const handleAppleLogin = async () => {
    try {
      // The user will be redirected to OAuth provider's login page
      await initOAuth({ provider: "apple" });
    } catch (err) {
      // Handle errors (network issues, validation errors, etc.)
      console.error(err);
    }
  };

  // Reset view when dialog closes or opens
  const onOpenChange = (open: boolean) => {
    if (!open) {
      setTimeout(() => {
        setView("login");
        form.reset();
      }, 300); // Reset after animation
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <CentuariButton variant="primary" className="flex-1">
          Connect Wallet
        </CentuariButton>
      </DialogTrigger>
      <DialogContent className="flex max-h-[min(600px,80vh)] p-6 flex-col gap-0 sm:max-w-md data-[state=open]:!zoom-in-0 data-[state=open]:duration-600">
        <DialogHeader className="contents space-y-0 text-left">
          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-lg">
            <div className="absolute w-[568px] h-[450px] -top-72 left-0 bg-primary-blue-base/50 blur-[264px] opacity-100 transition-opacity duration-500" />
            <div className="absolute w-[150px] h-[216px] -top-60 left-1/3 bg-white blur-3xl opacity-100 transition-opacity duration-500" />
          </div>

          {view === "login" ? (
            <div className="flex flex-col items-center text-center z-10">
              <div className="mb-6">
                <Image
                  src="/centuari-logo.png"
                  alt="Centuari Logo"
                  width={48}
                  height={48}
                />
              </div>
              <div className="w-[220px]">
                <CentuariTypography variant="heading-md" className="mb-4">
                  Link Your Account to Access Centuari
                </CentuariTypography>
                <CentuariTypography
                  variant="body-sm"
                  className="text-muted-foreground mb-8"
                >
                  Connect your wallet to earn and borrow instantly with
                  Centuari.
                </CentuariTypography>
              </div>

              <div className="w-full space-y-4">
                <Form {...form}>
                  <form
                    // onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <CentuariInput
                              id={`${id}-email`}
                              size="medium"
                              placeholder="Enter your email"
                              leftIcon={<Mail size={16} />}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-left" />
                        </FormItem>
                      )}
                    />
                    <CentuariButton
                      type="submit"
                      variant="primary"
                      className="w-full"
                      disabled={loading}
                    >
                      {loading ? "Loading..." : "Start Earning"}
                    </CentuariButton>
                  </form>
                </Form>
              </div>

              <div className="flex items-center gap-4 w-full py-6">
                <div className="h-px flex-1 border-t border-dashed border-white/10" />
                <span className="text-xs text-muted-foreground uppercase">
                  Or Connect with other way
                </span>
                <div className="h-px flex-1 border-t border-dashed border-white/10" />
              </div>

              <div className="flex gap-4 mb-6">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Chrome size={20} className="text-white" />
                </button>
                <button
                  type="button"
                  onClick={handleInstagramLogin}
                  disabled={loading}
                  className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Instagram size={20} className="text-white" />
                </button>
                <button
                  type="button"
                  onClick={handleAppleLogin}
                  disabled={loading}
                  className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Apple size={20} className="text-white" />
                </button>
              </div>

              <CentuariButton
                variant="secondary"
                className="w-auto px-2"
                onClick={() => setView("wallet")}
                disabled={loading}
                size="sm"
              >
                Use Wallet to Login
              </CentuariButton>
            </div>
          ) : (
            <CentuariConnectWallet onBack={() => setView("login")} />
          )}
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
