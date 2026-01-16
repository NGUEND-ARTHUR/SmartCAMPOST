import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";

import { canTransition } from "@/lib/transitions";
import { ActionButton } from "@/components/transitions/ActionButton";

describe("transition action visibility (UI)", () => {
  it("renders disabled action with tooltip reason when transition is invalid", () => {
    const decision = canTransition(
      { kind: "parcel", status: "DELIVERED" },
      { type: "PARCEL_SET_STATUS", to: "CANCELLED" },
    );

    const { getByRole } = render(
      <ActionButton
        variant="destructive"
        disabled={!decision.allowed}
        tooltip={
          !decision.allowed && "reason" in decision
            ? decision.reason
            : undefined
        }
      >
        Cancel
      </ActionButton>,
    );

    const btn = getByRole("button", { name: "Cancel" });
    expect(btn).toBeDisabled();

    // Tooltip is implemented via title on wrapper
    expect(btn.parentElement).toHaveAttribute("title");
  });
});
