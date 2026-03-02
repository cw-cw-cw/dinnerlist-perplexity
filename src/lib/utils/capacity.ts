interface CapacityInfo {
  display: string;
  isFull: boolean;
  isWaitlistOnly: boolean;
}

export function getConfirmedCount(
  rsvps: Array<{ bringingGuest: boolean; status: string }>
): number {
  return rsvps
    .filter((r) => r.status === "CONFIRMED" || r.status === "CHECKED_IN")
    .reduce((sum, r) => sum + 1 + (r.bringingGuest ? 1 : 0), 0);
}

export function getSpotsRemainingDisplay(
  confirmedCount: number, publicCapacity: number,
  privateCapacity: number, waitlistEnabled: boolean
): CapacityInfo {
  if (confirmedCount >= privateCapacity) {
    return {
      display: waitlistEnabled ? "Waitlist only" : "Reached capacity",
      isFull: true, isWaitlistOnly: waitlistEnabled,
    };
  }
  if (confirmedCount >= publicCapacity) {
    return { display: "Limited spots remaining", isFull: false, isWaitlistOnly: false };
  }
  const remaining = publicCapacity - confirmedCount;
  return {
    display: `${remaining} of ${publicCapacity} spots remaining`,
    isFull: false, isWaitlistOnly: false,
  };
}

export function getGuestCapacityDisplay(
  confirmedCount: number, publicCapacity: number, privateCapacity: number
): { spotsText: string; percentFull: number; urgencyLevel: "low" | "medium" | "high" | "full" } {
  const percentOfPrivate = confirmedCount / privateCapacity;

  if (confirmedCount >= privateCapacity) {
    return { spotsText: "This dinner has reached capacity", percentFull: 100, urgencyLevel: "full" };
  }

  if (confirmedCount >= publicCapacity) {
    return {
      spotsText: "Limited spots remaining",
      percentFull: Math.min(95, Math.round((confirmedCount / privateCapacity) * 100)),
      urgencyLevel: "high",
    };
  }

  const halfPublic = Math.floor(publicCapacity / 2);
  let displayRemaining: number;
  if (confirmedCount >= halfPublic) {
    const actualRemaining = publicCapacity - confirmedCount;
    displayRemaining = Math.min(actualRemaining, Math.ceil(publicCapacity * 0.3));
  } else {
    displayRemaining = publicCapacity - confirmedCount;
  }

  const percent = Math.round(percentOfPrivate * 100);
  let urgencyLevel: "low" | "medium" | "high" | "full" = "low";
  if (percent > 75) urgencyLevel = "high";
  else if (percent > 50) urgencyLevel = "medium";

  return { spotsText: `${displayRemaining} of ${publicCapacity} spots remaining`, percentFull: percent, urgencyLevel };
}
