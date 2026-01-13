import { describe, expect, it } from "vitest";
import { canTransition } from "@/lib/transitions";

describe("canTransition (mirrors backend transition rules)", () => {
  it("blocks parcel transitions from final states", () => {
    const decision = canTransition(
      { kind: "parcel", status: "DELIVERED" },
      { type: "PARCEL_SET_STATUS", to: "CANCELLED" },
    );

    expect(decision.allowed).toBe(false);
    expect("reason" in decision ? decision.reason : "").toContain(
      "final state",
    );
  });

  it("allows cancel/return from non-final parcel states", () => {
    const cancel = canTransition(
      { kind: "parcel", status: "IN_TRANSIT" },
      { type: "PARCEL_SET_STATUS", to: "CANCELLED" },
    );
    const ret = canTransition(
      { kind: "parcel", status: "IN_TRANSIT" },
      { type: "PARCEL_SET_STATUS", to: "RETURNED" },
    );

    expect(cancel.allowed).toBe(true);
    expect(ret.allowed).toBe(true);
  });

  it("blocks backwards parcel transitions", () => {
    const decision = canTransition(
      { kind: "parcel", status: "ARRIVED_HUB" },
      { type: "PARCEL_SET_STATUS", to: "ACCEPTED" },
    );

    expect(decision.allowed).toBe(false);
  });

  it("enforces pickup state machine", () => {
    expect(
      canTransition(
        { kind: "pickup", state: "REQUESTED" },
        { type: "PICKUP_SET_STATE", to: "ASSIGNED" },
      ).allowed,
    ).toBe(true);

    expect(
      canTransition(
        { kind: "pickup", state: "REQUESTED" },
        { type: "PICKUP_SET_STATE", to: "COMPLETED" },
      ).allowed,
    ).toBe(false);
  });
});
