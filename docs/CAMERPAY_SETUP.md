# CamerPay Setup for SmartCAMPOST

## CamerPay Dashboard Fields

On **Developer > API Keys & Webhooks**:

- **API token**: create/copy your CamerPay token, then set it as `CAMERPAY_API_TOKEN` in Render and local backend env.
- **URL de callback**: use:
  `https://smartcampost-backend.onrender.com/api/payments/webhooks/camerpay`
- **Secret HMAC**: generate or paste your shared secret, then set the same value as `CAMERPAY_HMAC_SECRET` in Render and local backend env.

Do not paste CamerPay's generic webhook URLs into the callback field. Those URLs are for CamerPay's own webhook categories; your callback must be your backend endpoint.

## Render Backend Environment Variables

Set these on the Render backend service:

```env
PAYMENT_GATEWAY=camerpay
CAMERPAY_API_TOKEN=<your-camerpay-token>
CAMERPAY_HMAC_SECRET=<your-hmac-secret>
CAMERPAY_INIT_URL=https://camerpay.biz/api/payment/initiate
CAMERPAY_VERIFY_URL=https://camerpay.biz/api/payment/{externalRef}/status
CAMERPAY_CALLBACK_URL=https://smartcampost-backend.onrender.com/api/payments/webhooks/camerpay
CAMERPAY_RETURN_URL=https://smartcampost-frontend.vercel.app/client/payments
```

Restart the Render service after saving the variables.

## Webhook Verification

The backend verifies incoming callbacks with HMAC-SHA256 over the raw request body. It accepts common signature headers such as:

- `X-CamerPay-Signature`
- `X-Signature`
- `X-Webhook-Signature`
- `X-Hmac-Signature`
- `Signature`

The webhook updates the matching `Payment` by CamerPay external reference.
