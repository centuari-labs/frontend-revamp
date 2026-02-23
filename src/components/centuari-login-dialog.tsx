"use client";

import {
  useLoginWithEmail,
  useLoginWithOAuth,
  useLoginWithSiwe,
  usePrivy,
  useWallets,
} from "@privy-io/react-auth";
import { useSetActiveWallet } from "@privy-io/wagmi";
import { ArrowLeft, Mail } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
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

export function CentuariLoginDialog({
  open,
  onOpenChange,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const id = useId();
  const { connectAsync } = useConnect();
  const chainId = useChainId();
  const { setActiveWallet } = useSetActiveWallet();
  const { address: wagmiAddress, isConnected } = useConnection();
  const { wallets } = useWallets();
  const { authenticated } = usePrivy();
  const { generateSiweMessage, loginWithSiwe } = useLoginWithSiwe();
  const [view, setView] = useState<"login" | "otp" | "wallet">("login");
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(""));
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [emailLoading, setEmailLoading] = useState(false);
  const { state, loading, initOAuth } = useLoginWithOAuth({
    onComplete: () => {
      setOauthError(null);
      onOpenChange?.(false);
    },
    onError: (error) => {
      console.error("OAuth login error:", error);
      setOauthError("Login failed. Please try again.");
    },
  });
  const { sendCode, loginWithCode } = useLoginWithEmail({
    onComplete: () => {
      onOpenChange?.(false);
    },
    onError: (error) => {
      console.error("Email login error:", error);
      setEmailError("Invalid code. Please try again.");
      setEmailLoading(false);
    },
  });

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

      await setActiveWallet(walletInPrivy!);

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

  // Step 1: Send OTP code to email
  const handleEmailSubmit = async (values: EmailFormValues) => {
    try {
      setEmailError(null);
      setEmailLoading(true);
      await sendCode({ email: values.email });
      setView("otp");
    } catch (err) {
      console.error("Send code error:", err);
      setEmailError("Failed to send code. Please try again.");
    } finally {
      setEmailLoading(false);
    }
  };

  const otpCode = otpDigits.join("");

  const handleOtpChange = useCallback(
    (index: number, value: string) => {
      // Handle paste of full code
      if (value.length > 1) {
        const digits = value.replace(/\D/g, "").slice(0, 6).split("");
        const newOtp = [...otpDigits];
        digits.forEach((d, i) => {
          if (index + i < 6) newOtp[index + i] = d;
        });
        setOtpDigits(newOtp);
        setEmailError(null);
        const nextIndex = Math.min(index + digits.length, 5);
        otpRefs.current[nextIndex]?.focus();
        return;
      }

      if (value && !/^\d$/.test(value)) return;

      const newOtp = [...otpDigits];
      newOtp[index] = value;
      setOtpDigits(newOtp);
      setEmailError(null);

      if (value && index < 5) {
        otpRefs.current[index + 1]?.focus();
      }
    },
    [otpDigits]
  );

  const handleOtpKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
        otpRefs.current[index - 1]?.focus();
      }
    },
    [otpDigits]
  );

  // Step 2: Verify OTP code
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setEmailError(null);
      setEmailLoading(true);
      await loginWithCode({ code: otpCode });
    } catch (err) {
      console.error("Verify code error:", err);
      setEmailError("Invalid code. Please try again.");
    } finally {
      setEmailLoading(false);
    }
  };

  // Resend OTP code
  const handleResendCode = async () => {
    try {
      setEmailError(null);
      setEmailLoading(true);
      setOtpDigits(Array(6).fill(""));
      await sendCode({ email: form.getValues("email") });
    } catch (err) {
      console.error("Resend code error:", err);
      setEmailError("Failed to resend code. Please try again.");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleSocialLogin = async (provider: "google" | "twitter") => {
    try {
      setOauthError(null);
      await initOAuth({ provider });
    } catch (err) {
      console.error(`${provider} login error:`, err);
      setOauthError(`Failed to login with ${provider}. Please try again.`);
    }
  };

  // Close dialog when user becomes authenticated (e.g. after OAuth redirect)
  useEffect(() => {
    if (authenticated && open) {
      onOpenChange?.(false);
    }
  }, [authenticated, open, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <CentuariButton variant="primary" className="flex-1 w-full" size={"lg"}>
          Connect Wallet
        </CentuariButton>
      </DialogTrigger>
      <DialogContent className="flex max-h-[min(600px,80vh)] p-6 flex-col gap-0 sm:max-w-md data-[state=open]:!zoom-in-0 data-[state=open]:duration-600 z-[200]">
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
                    onSubmit={form.handleSubmit(handleEmailSubmit)}
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
                    {emailError && (
                      <p className="text-red-400 text-xs text-left">{emailError}</p>
                    )}
                    <CentuariButton
                      type="submit"
                      variant="primary"
                      className="w-full"
                      disabled={emailLoading || loading}
                    >
                      {emailLoading ? "Sending..." : "Start Earning"}
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

              {oauthError && (
                <p className="text-red-400 text-xs text-center">{oauthError}</p>
              )}

              <div className="flex h-8 gap-1 items-center justify-center mb-4">
                <button
                  type="button"
                  onClick={() => handleSocialLogin("google")}
                  disabled={loading}
                  className="h-9 w-9 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Image
                    src="/icons/google.svg"
                    alt="Google"
                    width={16}
                    height={16}
                    className="bg-white h-4 w-4 rounded-full p-0.5"
                  />
                </button>
                <button
                  type="button"
                  onClick={() => handleSocialLogin("twitter")}
                  disabled={loading}
                  className="h-9 w-9 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Image
                    src="/icons/x.svg"
                    alt="X"
                    width={16}
                    height={16}
                    className="bg-white h-4 w-4 rounded-full p-0.5"
                  />
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
          ) : view === "otp" ? (
            <div className="flex flex-col items-center text-center z-10">
              <button
                type="button"
                onClick={() => {
                  setView("login");
                  setOtpDigits(Array(6).fill(""));
                  setEmailError(null);
                }}
                className="self-start mb-2 text-muted-foreground hover:text-white transition-colors"
              >
                <ArrowLeft size={20} />
              </button>

              <div className="mb-6 flex items-center justify-center w-16 h-16 rounded-full bg-white/5">
                <Mail size={28} className="text-muted-foreground" />
              </div>

              <CentuariTypography variant="heading-md" className="mb-2">
                Enter Confirmation Code
              </CentuariTypography>
              <CentuariTypography
                variant="body-sm"
                className="text-muted-foreground mb-8 max-w-[280px]"
              >
                Please check{" "}
                <span className="text-white font-medium">
                  {form.getValues("email")}
                </span>{" "}
                for an email from privy.io and enter your code below.
              </CentuariTypography>

              <form onSubmit={handleOtpSubmit} className="w-full space-y-6">
                <div className="flex justify-center gap-2">
                  {otpDigits.map((digit, index) => (
                    <input
                      key={`otp-${id}-${index}`}
                      ref={(el) => { otpRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      autoFocus={index === 0}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pasted = e.clipboardData.getData("text");
                        handleOtpChange(index, pasted);
                      }}
                      className="w-11 h-14 text-center text-lg font-medium rounded-xl border border-white/10 bg-white/5 text-white focus:border-primary-blue-base focus:ring-1 focus:ring-primary-blue-base/50 outline-none transition-colors placeholder:text-muted-foreground"
                    />
                  ))}
                </div>

                {emailError && (
                  <p className="text-red-400 text-xs text-center">{emailError}</p>
                )}

                <CentuariButton
                  type="submit"
                  variant="primary"
                  className="w-full"
                  disabled={emailLoading || otpCode.length < 6}
                >
                  {emailLoading ? "Verifying..." : "Verify Code"}
                </CentuariButton>
              </form>

              <p className="mt-6 text-sm text-muted-foreground">
                Didn&apos;t get an email?{" "}
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={emailLoading}
                  className="text-primary-blue-base hover:underline disabled:opacity-50"
                >
                  Resend code
                </button>
              </p>
            </div>
          ) : (
            <CentuariConnectWallet onBack={() => setView("login")} />
          )}
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
