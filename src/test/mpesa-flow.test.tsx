import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MpesaFlow } from "@/components/mpesa-flow";

afterEach(() => { cleanup(); vi.useRealTimers(); });

function openPaybill() {
  vi.useFakeTimers();
  render(<MpesaFlow amount={45150} phone="0712345678" onClose={() => {}} />);
  act(() => vi.advanceTimersByTime(10_000));
}

describe("M-PESA fallback", () => {
  it("fails at 10 seconds, not before", () => {
    vi.useFakeTimers();
    render(<MpesaFlow amount={45150} phone="0712345678" onClose={() => {}} />);
    act(() => vi.advanceTimersByTime(9999));
    expect(screen.queryByRole("button", { name: "I have paid" })).toBeNull();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByRole("button", { name: "I have paid" })).toBeDefined();
  });
  it("uses Paybill 775093", () => {
    openPaybill();
    expect(screen.getByTestId("mpesa-paybill").textContent).toBe("775093");
  });
  it("uses account 142810011", () => {
    openPaybill();
    expect(screen.getByTestId("mpesa-account").textContent).toBe("142810011");
  });
  it("enters a pending verification state after payment acknowledgement", () => {
    openPaybill();
    fireEvent.click(screen.getByRole("button", { name: "I have paid" }));
    expect(screen.getByRole("status")).toBeDefined();
    expect(screen.queryByRole("button", { name: "I have paid" })).toBeNull();
  });
});