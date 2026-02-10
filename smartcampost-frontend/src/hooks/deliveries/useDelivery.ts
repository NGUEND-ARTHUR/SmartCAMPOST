/**
 * Delivery React Query Hooks
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deliveryService,
  CompleteDeliveryRequest,
  PickupAtAgencyRequest,
  RescheduleDeliveryRequest,
  ReturnToSenderRequest,
  StartDeliveryRequest,
  DeliveryOtpSendRequest,
  DeliveryOtpVerificationRequest,
  FinalDeliveryRequest,
} from "@/services";
import { parcelKeys } from "../parcels/useParcels";

const deliveryKeys = {
  all: ["deliveries"] as const,
  status: (parcelId: string) =>
    [...deliveryKeys.all, "status", parcelId] as const,
};

export function useSendDeliveryOtp() {
  return useMutation({
    mutationFn: (data: DeliveryOtpSendRequest) => deliveryService.sendOtp(data),
  });
}

export function useVerifyDeliveryOtp() {
  return useMutation({
    mutationFn: (data: DeliveryOtpVerificationRequest) =>
      deliveryService.verifyOtp(data),
  });
}

export function useResendDeliveryOtp() {
  return useMutation({
    mutationFn: ({
      parcelId,
      latitude,
      longitude,
      notes,
    }: {
      parcelId: string;
      latitude: number;
      longitude: number;
      notes?: string;
    }) => deliveryService.resendOtp(parcelId, latitude, longitude, notes),
  });
}

export function useStartDelivery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: StartDeliveryRequest) =>
      deliveryService.startDelivery(data),
    onSuccess: (resp) => {
      queryClient.invalidateQueries({
        queryKey: parcelKeys.detail(resp.parcelId),
      });
      queryClient.invalidateQueries({ queryKey: parcelKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: deliveryKeys.status(resp.parcelId),
      });
    },
  });
}

export function useCompleteDelivery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CompleteDeliveryRequest) =>
      deliveryService.completeDelivery(data),
    onSuccess: (resp) => {
      queryClient.invalidateQueries({
        queryKey: parcelKeys.detail(resp.parcelId),
      });
      queryClient.invalidateQueries({ queryKey: parcelKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: deliveryKeys.status(resp.parcelId),
      });
    },
  });
}

export function useDeliveryStatus(parcelId: string) {
  return useQuery({
    queryKey: deliveryKeys.status(parcelId),
    queryFn: () => deliveryService.getStatus(parcelId),
    enabled: !!parcelId,
  });
}

export function useMarkDeliveryFailed() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      parcelId,
      reason,
      latitude,
      longitude,
      notes,
    }: {
      parcelId: string;
      reason: string;
      latitude: number;
      longitude: number;
      notes?: string;
    }) =>
      deliveryService.markFailed(parcelId, reason, latitude, longitude, notes),
    onSuccess: (resp) => {
      queryClient.invalidateQueries({
        queryKey: parcelKeys.detail(resp.parcelId),
      });
      queryClient.invalidateQueries({ queryKey: parcelKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: deliveryKeys.status(resp.parcelId),
      });
    },
  });
}

export function useRescheduleDelivery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      parcelId,
      data,
    }: {
      parcelId: string;
      data: RescheduleDeliveryRequest;
    }) => deliveryService.reschedule(parcelId, data),
    onSuccess: (resp) => {
      queryClient.invalidateQueries({
        queryKey: parcelKeys.detail(resp.parcelId),
      });
      queryClient.invalidateQueries({
        queryKey: deliveryKeys.status(resp.parcelId),
      });
    },
  });
}

export function useReturnToSender() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      parcelId,
      data,
    }: {
      parcelId: string;
      data: ReturnToSenderRequest;
    }) => deliveryService.returnToSender(parcelId, data),
    onSuccess: (resp) => {
      queryClient.invalidateQueries({
        queryKey: parcelKeys.detail(resp.parcelId),
      });
      queryClient.invalidateQueries({
        queryKey: deliveryKeys.status(resp.parcelId),
      });
    },
  });
}

export function usePickupAtAgency() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PickupAtAgencyRequest) =>
      deliveryService.pickupAtAgency(data),
    onSuccess: (resp) => {
      queryClient.invalidateQueries({
        queryKey: parcelKeys.detail(resp.parcelId),
      });
      queryClient.invalidateQueries({ queryKey: parcelKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: deliveryKeys.status(resp.parcelId),
      });
    },
  });
}

export function useConfirmFinalDelivery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: FinalDeliveryRequest) =>
      deliveryService.confirmFinalDelivery(data),
    onSuccess: (_, data) => {
      const parcelId = data.otp.parcelId;
      queryClient.invalidateQueries({ queryKey: parcelKeys.detail(parcelId) });
      queryClient.invalidateQueries({ queryKey: parcelKeys.lists() });
    },
  });
}
