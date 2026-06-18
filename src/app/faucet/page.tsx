import { notFound } from "next/navigation";
import { FaucetPageClient } from "./faucet-page-client";
import { IS_FAUCET_ENABLED } from "@/lib/faucet-config";

export default function FaucetPage() {
	if (!IS_FAUCET_ENABLED) notFound();

	return <FaucetPageClient />;
}
