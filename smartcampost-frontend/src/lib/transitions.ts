export type ParcelStatus =
  | "CREATED"
  | "ACCEPTED"
  | "IN_TRANSIT"
  | "ARRIVED_HUB"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "RETURNED"
  | "CANCELLED";

export type PickupRequestState =
  | "REQUESTED"
  | "ASSIGNED"
  | "COMPLETED"
  | "CANCELLED";

export type EntityState =
  | { kind: "parcel"; status: ParcelStatus }
  | { kind: "pickup"; state: PickupRequestState };

export type Action =
  | { type: "PARCEL_SET_STATUS"; to: ParcelStatus }
  | { type: "PICKUP_SET_STATE"; to: PickupRequestState };

export type TransitionDecision =
  | { allowed: true }
  | {
      allowed: false;
      reason: string;
    };

const parcelOrder: ParcelStatus[] = [
  "CREATED",
  "ACCEPTED",
  "IN_TRANSIT",
  "ARRIVED_HUB",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "RETURNED",
  "CANCELLED",
];

function parcelDecision(
  current: ParcelStatus,
  next: ParcelStatus,
): TransitionDecision {
  if (current === next) return { allowed: true };

  // final states: DELIVERED, RETURNED, CANCELLED
  if (
    current === "DELIVERED" ||
    current === "RETURNED" ||
    current === "CANCELLED"
  ) {
    return {
      allowed: false,
      reason: `Cannot change status from a final state: ${current}`,
    };
  }

  // Cancel/Return always possible before final
  if (next === "CANCELLED" || next === "RETURNED") {
    return { allowed: true };
  }

  const curIdx = parcelOrder.indexOf(current);
  const nextIdx = parcelOrder.indexOf(next);
  if (curIdx === -1 || nextIdx === -1) {
    return {
      allowed: false,
      reason: `Unknown parcel status transition: ${current} -> ${next}`,
    };
  }

  // must progress forward
  if (nextIdx < curIdx) {
    return {
      allowed: false,
      reason: `Invalid status transition: ${current} -> ${next}`,
    };
  }

  return { allowed: true };
}

function pickupDecision(
  current: PickupRequestState,
  next: PickupRequestState,
): TransitionDecision {
  if (current === next) return { allowed: true };

  if (current === "COMPLETED" || current === "CANCELLED") {
    return {
      allowed: false,
      reason: `Cannot change state from a final state: ${current}`,
    };
  }

  if (next === "CANCELLED") return { allowed: true };

  if (current === "REQUESTED" && next === "ASSIGNED") return { allowed: true };
  if (current === "ASSIGNED" && next === "COMPLETED") return { allowed: true };

  return {
    allowed: false,
    reason: `Invalid pickup state transition: ${current} -> ${next}`,
  };
}

export function canTransition(
  entityState: EntityState,
  action: Action,
): TransitionDecision {
  if (entityState.kind === "parcel" && action.type === "PARCEL_SET_STATUS") {
    return parcelDecision(entityState.status, action.to);
  }

  if (entityState.kind === "pickup" && action.type === "PICKUP_SET_STATE") {
    return pickupDecision(entityState.state, action.to);
  }

  return { allowed: false, reason: "Action not applicable to entity" };
}
