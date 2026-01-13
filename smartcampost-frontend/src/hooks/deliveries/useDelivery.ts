/**
 * Delivery React Query Hooks
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  deliveryService,
  DeliveryOtpSendRequest,
  DeliveryOtpVerificationRequest,
  FinalDeliveryRequest,
} from "@/services";
import { parcelKeys } from "../parcels/useParcels";

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
