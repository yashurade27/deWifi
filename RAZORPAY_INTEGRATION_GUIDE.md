# Razorpay Integration Guide for AirLink

## ðŸŽ‰ Integration Complete!

Razorpay test API has been successfully integrated into your AirLink application. This guide will help you set up and test the payment functionality.

## ðŸ“‹ What Was Done

### Backend Changes

1. **Installed Razorpay SDK**
   - Added `razorpay` package to backend dependencies

2. **Configuration Updates**
   - Added Razorpay credentials to `.env` file
   - Updated `config.ts` to export Razorpay keys
   - Updated `.env.example` with Razorpay template

3. **Created Razorpay Utility** (`backend/src/utils/razorpay.ts`)
   - `createRazorpayOrder()` - Creates payment orders
   - `verifyRazorpaySignature()` - Verifies payment signatures
   - `fetchPaymentDetails()` - Fetches payment information
   - `createRefund()` - Processes refunds

4. **Updated Booking Routes** (`backend/src/routes/bookings.ts`)
   - Modified POST `/api/bookings` to create actual Razorpay orders
   - Updated POST `/api/bookings/verify-payment` to verify signatures
   - Added GET `/api/bookings/razorpay-key` to provide key to frontend
   - Implemented actual refund processing in cancel route

### Frontend Changes

1. **Added Razorpay Checkout Script**
   - Included Razorpay SDK in `index.html`

2. **Created TypeScript Definitions**
   - Added `types/razorpay.d.ts` for type safety

3. **Updated BookWifi Component** (`frontend/src/pages/BookWifi.tsx`)
   - Integrated Razorpay checkout modal
   - Implemented payment handler with proper verification
   - Added error handling and user feedback

## ðŸ” Setup Instructions

### Step 1: Get Razorpay Test Credentials

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/signin)
2. Create an account or log in
3. Navigate to **Settings** â†’ **API Keys**
4. Click on **Generate Test Key**
5. Copy both **Key ID** and **Key Secret**

### Step 2: Configure Backend

1. Open `backend/.env` file
2. Replace the placeholder values:

```env
# Current placeholders:
RAZORPAY_KEY_ID=rzp_test_your_key_id_here
RAZORPAY_KEY_SECRET=your_key_secret_here

# Replace with your actual test credentials:
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXX
RAZORPAY_KEY_SECRET=YYYYYYYYYYYYYYYY
```

### Step 3: Start the Application

1. **Start Backend:**

   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

## ðŸ§ª Testing the Integration

### Test Mode Features

In test mode, Razorpay provides:

- Test card numbers that simulate different scenarios
- No actual money is charged
- All transactions are for testing only

### Test Card Numbers

Use these test cards for different scenarios:

**Successful Payment:**

- Card Number: `4111 1111 1111 1111`
- CVV: Any 3 digits
- Expiry: Any future date
- OTP: `1234` (if prompted)

**Payment Failure:**

- Card Number: `4000 0000 0000 0002`
- This will simulate a failed payment

**International Card:**

- Card Number: `5555 5555 5555 4444`
- Tests international payments

### Testing Flow

1. **Navigate to WiFi Booking:**
   - Go to Explore page
   - Select a WiFi spot
   - Click "Book Now"

2. **Configure Booking:**
   - Select duration (hours)
   - Choose start time (now or scheduled)
   - Review price breakdown

3. **Initiate Payment:**
   - Click "Pay â‚¹XXX" button
   - Razorpay checkout modal will open

4. **Complete Payment:**
   - Enter test card details
   - Click "Pay"
   - Payment will be processed

5. **Access WiFi:**
   - On success, you'll see confirmation
   - WiFi credentials will be revealed
   - Navigate to session page to view details

## ðŸ” Verification Process

The payment flow includes multiple security checks:

1. **Order Creation**
   - Backend creates a Razorpay order with unique order ID
   - Amount and booking details are stored

2. **Payment Collection**
   - Razorpay handles the payment UI and processing
   - User completes payment through secure modal

3. **Signature Verification**
   - Backend verifies the payment signature using HMAC-SHA256
   - Ensures payment authenticity and prevents tampering
   - Only verified payments activate WiFi access

4. **Credential Release**
   - WiFi credentials revealed only after successful verification
   - User count incremented on the spot

## ðŸ”„ Refund Testing

To test refunds:

1. Complete a successful booking
2. Navigate to User Dashboard
3. Find the active booking
4. Click "Cancel Booking"
5. Refund will be initiated automatically
6. Check Razorpay dashboard to see the refund

## ðŸ“Š Monitoring Payments

### Razorpay Dashboard

Access your [Razorpay Dashboard](https://dashboard.razorpay.com) to:

- View all test transactions
- Monitor payment success/failure rates
- Track refunds
- Debug integration issues

### Test Mode Indicator

- Test mode payments show in the test dashboard
- Switch to live mode only after thorough testing
- Live mode requires business verification

## ðŸš€ Going Live

When ready to accept real payments:

1. **Complete KYC:**
   - Submit business documents to Razorpay
   - Get your account verified

2. **Generate Live Keys:**
   - Go to Settings â†’ API Keys
   - Click "Generate Live Key"
   - Copy the live credentials

3. **Update Environment:**

   ```env
   RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXXXX
   RAZORPAY_KEY_SECRET=live_key_secret_here
   ```

4. **Test Thoroughly:**
   - Use live keys in staging environment first
   - Verify all flows work correctly
   - Only then deploy to production

## ðŸ› ï¸ Troubleshooting

### Common Issues

**1. "Razorpay credentials not set" warning**

- Ensure `.env` file has correct credentials
- Restart backend server after updating .env

**2. "Payment verification failed"**

- Check that order_id matches the booking
- Verify signature verification is working
- Check backend logs for details

**3. Razorpay checkout doesn't open**

- Ensure Razorpay script is loaded in HTML
- Check browser console for errors
- Verify the key returned from backend is correct

**4. Refund fails**

- Check that payment exists in Razorpay
- Ensure payment was captured (not just authorized)
- Verify key/secret are correct

### Debug Mode

Enable detailed logging:

```typescript
// In backend/src/utils/razorpay.ts
console.log("Creating order:", { amount, receipt, notes });
console.log("Razorpay response:", order);
```

## ðŸ“ API Endpoints

### GET `/api/bookings/razorpay-key`

- Returns Razorpay public key for frontend
- Requires authentication

### POST `/api/bookings`

- Creates booking and Razorpay order
- Returns order details for checkout

### POST `/api/bookings/verify-payment`

- Verifies payment signature
- Activates WiFi access on success

### POST `/api/bookings/:id/cancel`

- Cancels booking
- Initiates refund if payment was made

## ðŸ”’ Security Best Practices

1. **Never expose key secret:**
   - Keep in `.env` file only
   - Never commit to version control
   - Don't send to frontend

2. **Always verify signatures:**
   - Never trust frontend payment confirmations
   - Verify every payment on backend

3. **Use HTTPS in production:**
   - Razorpay requires HTTPS for live mode
   - Use SSL certificates

4. **Implement webhooks:**
   - Set up webhooks for payment status updates
   - Handle delayed payment confirmations
   - Track payment failures

## ðŸ“š Additional Resources

- [Razorpay Documentation](https://razorpay.com/docs/)
- [Payment Gateway Integration Guide](https://razorpay.com/docs/payments/payment-gateway/)
- [Test Cards List](https://razorpay.com/docs/payments/payments/test-card-upi-details/)
- [Webhook Setup](https://razorpay.com/docs/webhooks/)

## ðŸŽ¯ Next Steps

1. **Set up Razorpay test account**
2. **Configure credentials in `.env`**
3. **Test the complete booking flow**
4. **Test refund functionality**
5. **Monitor test transactions**
6. **Prepare for production deployment**

## âœ… Success Checklist

- [ ] Razorpay account created
- [ ] Test credentials configured
- [ ] Backend server running
- [ ] Frontend server running
- [ ] Test payment successful
- [ ] WiFi credentials revealed after payment
- [ ] Refund processed successfully
- [ ] Transactions visible in Razorpay dashboard

---

**Need Help?** Contact Razorpay support or check their comprehensive documentation.

**Happy Testing! ðŸš€**

