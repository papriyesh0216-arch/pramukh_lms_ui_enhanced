# LMS In-App Dialer Provider Contract

The frontend dialer stays inside the LMS and calls this endpoint when live calling is configured.

Configure from the dialer gear button, or from the browser console/app bootstrap:

```js
localStorage.setItem('pa-call-api-endpoint', 'https://your-domain.example/api/lms-call');
localStorage.setItem('pa-call-api-token', 'YOUR_SECURE_TOKEN');
localStorage.setItem('pa-call-provider', 'Twilio or Exotel');
localStorage.setItem('pa-agent-phone', '+919999999999');
```

Start call request:

```json
{
  "action": "start_call",
  "leadId": 1,
  "leadName": "Rahul Patel",
  "phone": "9876543210",
  "agentNumber": "+919999999999",
  "source": "pramukh-lms"
}
```

Expected response:

```json
{
  "provider": "Twilio",
  "sessionId": "CALL_SESSION_ID"
}
```

End call request:

```json
{
  "action": "end_call",
  "sessionId": "CALL_SESSION_ID",
  "leadId": 1,
  "source": "pramukh-lms"
}
```

The backend should place the actual call through your telephony provider and return the session ID. The LMS never redirects to the phone dialer.

Connection test request:

```json
{
  "action": "test_connection",
  "agentNumber": "+919999999999",
  "source": "pramukh-lms"
}
```

Expected response:

```json
{
  "provider": "Twilio",
  "ok": true
}
```
