import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAmountInput } from "@/hooks/use-amount-input";

describe("useAmountInput", () => {
  it("initializes with defaults", () => {
    const { result } = renderHook(() => useAmountInput());
    expect(result.current.amount).toBe("");
    expect(result.current.displayAmount).toBe("");
  });

  it("initializes with provided values", () => {
    const { result } = renderHook(() => useAmountInput("1000", "1,000"));
    expect(result.current.amount).toBe("1000");
    expect(result.current.displayAmount).toBe("1,000");
  });

  it("handleChange formats and stores values", () => {
    const { result } = renderHook(() => useAmountInput());
    act(() => {
      result.current.handleChange({
        target: { value: "12345" },
      } as React.ChangeEvent<HTMLInputElement>);
    });
    expect(result.current.amount).toBe("12345");
    expect(result.current.displayAmount).toBe("12,345");
  });

  it("handleChange strips non-numeric chars", () => {
    const { result } = renderHook(() => useAmountInput());
    act(() => {
      result.current.handleChange({
        target: { value: "1,234.56" },
      } as React.ChangeEvent<HTMLInputElement>);
    });
    expect(result.current.amount).toBe("1234.56");
    expect(result.current.displayAmount).toBe("1,234.56");
  });

  it("setMax sets formatted max value", () => {
    const { result } = renderHook(() => useAmountInput());
    act(() => {
      result.current.setMax(50000);
    });
    expect(result.current.amount).toBe("50000");
    expect(result.current.displayAmount).toBe("50,000");
  });

  it("reset clears both values", () => {
    const { result } = renderHook(() => useAmountInput("100", "100"));
    act(() => {
      result.current.reset();
    });
    expect(result.current.amount).toBe("");
    expect(result.current.displayAmount).toBe("");
  });

  it("setAmount and setDisplayAmount work directly", () => {
    const { result } = renderHook(() => useAmountInput());
    act(() => {
      result.current.setAmount("999");
      result.current.setDisplayAmount("999");
    });
    expect(result.current.amount).toBe("999");
    expect(result.current.displayAmount).toBe("999");
  });
});
