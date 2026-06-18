import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
	CentuariTxConfirmDialog,
	type TxConfirmationDetails,
} from "@/components/centuari-tx-confirm-dialog";

const baseDetails: TxConfirmationDetails = {
	action: "Approve",
	amount: "100",
	symbol: "USDC",
	tokenAddress: "0x6B8d9A4C6EBC58672c00b7b9CF5f450654f5e1F0",
	spender: "0xb0103A9a9CFb4e2EbE565594e487b29283ac02eB",
	spenderLabel: "Centuari Treasury (HubDepositor)",
	chainName: "Arbitrum Sepolia",
	chainId: 421614,
};

describe("CentuariTxConfirmDialog", () => {
	it("renders action verb, amount, and symbol when open", () => {
		render(
			<CentuariTxConfirmDialog
				open
				details={baseDetails}
				onConfirm={vi.fn()}
				onCancel={vi.fn()}
			/>,
		);
		expect(
			screen.getByRole("heading", { name: /Approve/i }),
		).toBeInTheDocument();
		expect(screen.getAllByText(/100 USDC/).length).toBeGreaterThan(0);
	});

	it("renders 'Deposit' when action is Deposit", () => {
		render(
			<CentuariTxConfirmDialog
				open
				details={{ ...baseDetails, action: "Deposit" }}
				onConfirm={vi.fn()}
				onCancel={vi.fn()}
			/>,
		);
		expect(
			screen.getByRole("heading", { name: /Deposit/i }),
		).toBeInTheDocument();
	});

	it("renders truncated token address", () => {
		render(
			<CentuariTxConfirmDialog
				open
				details={baseDetails}
				onConfirm={vi.fn()}
				onCancel={vi.fn()}
			/>,
		);
		expect(screen.getByText(/0x6B8d..e1F0/)).toBeInTheDocument();
	});

	it("renders truncated spender address with label", () => {
		render(
			<CentuariTxConfirmDialog
				open
				details={baseDetails}
				onConfirm={vi.fn()}
				onCancel={vi.fn()}
			/>,
		);
		expect(screen.getByText(/0xb010..02eB/)).toBeInTheDocument();
		expect(
			screen.getAllByText(/Centuari Treasury \(HubDepositor\)/).length,
		).toBeGreaterThan(0);
	});

	it("renders chain name and id", () => {
		render(
			<CentuariTxConfirmDialog
				open
				details={baseDetails}
				onConfirm={vi.fn()}
				onCancel={vi.fn()}
			/>,
		);
		expect(screen.getByText(/Arbitrum Sepolia/)).toBeInTheDocument();
		expect(screen.getByText(/421614/)).toBeInTheDocument();
	});

	it("calls onConfirm when Continue is clicked", async () => {
		const onConfirm = vi.fn();
		render(
			<CentuariTxConfirmDialog
				open
				details={baseDetails}
				onConfirm={onConfirm}
				onCancel={vi.fn()}
			/>,
		);
		await userEvent.click(screen.getByRole("button", { name: /continue/i }));
		expect(onConfirm).toHaveBeenCalledTimes(1);
	});

	it("calls onCancel when Cancel is clicked", async () => {
		const onCancel = vi.fn();
		render(
			<CentuariTxConfirmDialog
				open
				details={baseDetails}
				onConfirm={vi.fn()}
				onCancel={onCancel}
			/>,
		);
		await userEvent.click(screen.getByRole("button", { name: /cancel/i }));
		expect(onCancel).toHaveBeenCalledTimes(1);
	});

	it("does not render dialog content when open is false", () => {
		render(
			<CentuariTxConfirmDialog
				open={false}
				details={baseDetails}
				onConfirm={vi.fn()}
				onCancel={vi.fn()}
			/>,
		);
		expect(screen.queryByText(/100 USDC/)).not.toBeInTheDocument();
	});

	it("default focus is on the Cancel button (safer default)", () => {
		render(
			<CentuariTxConfirmDialog
				open
				details={baseDetails}
				onConfirm={vi.fn()}
				onCancel={vi.fn()}
			/>,
		);
		expect(screen.getByRole("button", { name: /cancel/i })).toHaveFocus();
	});

	it("Esc key triggers onCancel", async () => {
		const onCancel = vi.fn();
		render(
			<CentuariTxConfirmDialog
				open
				details={baseDetails}
				onConfirm={vi.fn()}
				onCancel={onCancel}
			/>,
		);
		await userEvent.keyboard("{Escape}");
		expect(onCancel).toHaveBeenCalledTimes(1);
	});
});
