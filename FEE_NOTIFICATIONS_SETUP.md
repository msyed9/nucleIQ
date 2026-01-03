# Fee Reminder SMS & WhatsApp Integration - Complete Setup Guide

##  Overview

The NucleIQ platform now supports automated fee reminder notifications via SMS and WhatsApp. This feature allows administrators to send individual or bulk fee reminders to parents/guardians of fee defaulters.

### Features Implemented
-  SMS notifications via Twilio, MSG91, or TextLocal
-  WhatsApp notifications via Twilio WhatsApp API or Official WhatsApp Business API
-  Pre-built message templates for fee reminders
-  Individual and bulk send capabilities
-  Message logging and tracking
-  Frontend UI with notification type selector
-  Automated background tasks for scheduled reminders

---

##  Quick Start

### 1. Backend Setup

#### Install Required Dependencies
```bash
pip install twilio requests python-decouple
```

#### Configure Environment Variables

Copy the example environment file:
```bash
cp backend/.env.example backend/.env
```

Edit ackend/.env and configure your preferred SMS and WhatsApp providers:

```env
# SMS Provider (choose one: twilio, msg91, textlocal)
SMS_PROVIDER=twilio

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# OR MSG91 Configuration
MSG91_AUTH_KEY=your_msg91_key
MSG91_SENDER_ID=NUCLEIQ
MSG91_ROUTE=4

# OR TextLocal Configuration
TEXTLOCAL_API_KEY=your_textlocal_key
TEXTLOCAL_SENDER=TXTLCL

# WhatsApp Provider (choose one: twilio, official)
WHATSAPP_PROVIDER=twilio

# Official WhatsApp Business API (if using official)
WHATSAPP_BUSINESS_ACCOUNT_ID=your_id
WHATSAPP_ACCESS_TOKEN=your_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_id
```

---

##  Provider Setup Guides

### Option 1: Twilio (Recommended for Testing)

**Pros:** Easy setup, supports both SMS and WhatsApp, good documentation
**Cons:** Higher cost per message

1. **Sign up at [Twilio](https://www.twilio.com)**
2. **Get your credentials:**
   - Account SID
   - Auth Token
   - Phone Number (purchase from Twilio console)
3. **For WhatsApp:**
   - Use Twilio Sandbox for testing: whatsapp:+14155238886
   - For production: Apply for WhatsApp Business API access

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

---

### Option 2: MSG91 (Best for India)

**Pros:** Lower cost, India-focused, high delivery rates
**Cons:** Primarily for Indian numbers

1. **Sign up at [MSG91](https://msg91.com)**
2. **Get your credentials:**
   - Auth Key from dashboard
   - Sender ID (register one like "NUCLEIQ")
   - Route: Use 4 for transactional messages
3. **Configure:**

```env
SMS_PROVIDER=msg91
MSG91_AUTH_KEY=your_auth_key_here
MSG91_SENDER_ID=NUCLEIQ
MSG91_ROUTE=4
```

---

### Option 3: TextLocal (UK-focused)

**Pros:** Good for UK markets, affordable
**Cons:** Region-specific

1. **Sign up at [TextLocal](https://www.textlocal.com)**
2. **Get your API Key**
3. **Configure:**

```env
SMS_PROVIDER=textlocal
TEXTLOCAL_API_KEY=your_api_key
TEXTLOCAL_SENDER=TXTLCL
```

---

### Option 4: Official WhatsApp Business API

**Pros:** Official support, advanced features, lower cost at scale
**Cons:** Complex setup, requires business verification

1. **Apply through [Meta Business](https://business.facebook.com)**
2. **Complete business verification**
3. **Get phone number approved**
4. **Configure webhook endpoint** (for receiving responses)
5. **Get credentials:**

```env
WHATSAPP_PROVIDER=official
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_id
WHATSAPP_ACCESS_TOKEN=your_permanent_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_VERIFY_TOKEN=nucleiq_webhook_token
```

---

##  Usage Guide

### Frontend Interface

1. **Navigate to Fee Defaulters page**
   - Go to Fees > Fee Defaulters

2. **Select Notification Type:**
   - SMS Only
   - WhatsApp Only
   - Both (SMS + WhatsApp)

3. **Send Individual Reminder:**
   - Click the  icon next to any defaulter
   - Notification will be sent using selected type

4. **Send Bulk Reminders:**
   - Select specific defaulters using checkboxes (optional)
   - Click " Send Bulk Reminders" button
   - Confirm in the dialog
   - If no defaulters are selected, reminders will be sent to ALL defaulters

---

##  Message Templates

### SMS Template
```
Dear Parent, Fee of Rs.{amount} for {student_name} is overdue. Please pay at the earliest. - {school_name}
```

### WhatsApp Templates

#### 1. Invoice Generated
```
 *Fee Invoice Generated*

Dear Parent,

A new fee invoice has been generated for *{student_name}*.

 Amount: {amount}
 Due Date: {due_date}

Please pay before the due date to avoid late fees.

Thank you!
_{school_name}_
```

#### 2. Payment Reminder
```
 *Fee Payment Reminder*

Dear Parent,

This is a friendly reminder that the fee payment for *{student_name}* is due soon.

 Amount: {amount}
 Due Date: {due_date}

Please make the payment at your earliest convenience.

_{school_name}_
```

#### 3. Overdue Notice
```
 *Fee Payment Overdue*

Dear Parent,

The fee payment for *{student_name}* is now overdue.

 Outstanding Amount: {amount}
 Due Date: {due_date}

Please pay immediately to avoid any inconvenience.

_{school_name}_
```

#### 4. Payment Confirmation
```
 *Payment Received*

Dear Parent,

Thank you! We have received the fee payment for *{student_name}*.

 Amount Paid: {amount}
 Date: {payment_date}
 Receipt No: {receipt_no}

_{school_name}_
```

---

##  Backend API Endpoints

### Send Individual Reminder
```
POST /api/fees/defaulters/{id}/send_reminder/
Content-Type: application/json

{
  "notification_type": "both"  // "sms", "whatsapp", or "both"
}
```

**Response:**
```json
{
  "message": "Reminder sent successfully",
  "results": {
    "sms": "sent",
    "whatsapp": "sent"
  }
}
```

---

### Send Bulk Reminders
```
POST /api/fees/defaulters/send_bulk_reminders/
Content-Type: application/json

{
  "notification_type": "both",
  "defaulter_ids": [1, 2, 3]  // Optional, omit to send to all
}
```

**Response:**
```json
{
  "message": "Bulk reminders sent to 45 out of 50 defaulters",
  "total": 50,
  "success_count": 45,
  "failed_count": 5,
  "errors": [
    "John Doe: No phone number",
    "Jane Smith: WhatsApp failed - Invalid number"
  ]
}
```

---

##  Automated Background Tasks

The system includes a Celery task that can be scheduled to send automatic reminders:

### Setup Celery Beat Schedule

Edit ackend/config/settings/base.py or add to your settings:

```python
from celery.schedules import crontab

CELERY_BEAT_SCHEDULE = {
    'send-fee-reminders-daily': {
        'task': 'fees.tasks.send_fee_reminders_task',
        'schedule': crontab(hour=10, minute=0),  # Daily at 10 AM
    },
}
```

### Run Celery Workers

```bash
# Start Celery worker
celery -A config worker -l info

# Start Celery beat scheduler
celery -A config beat -l info
```

---

##  Message Logging

All sent messages are automatically logged in the MessageLog model:

- Recipient phone number
- Message type (SMS/WhatsApp)
- Content
- Status (SENT/FAILED)
- Provider used
- Provider message ID
- Timestamp

View logs in Django Admin or through the Communication app.

---

##  Troubleshooting

### SMS Not Sending

1. **Check credentials:**
   ```bash
   python manage.py shell
   >>> from django.conf import settings
   >>> print(settings.TWILIO_ACCOUNT_SID)
   ```

2. **Verify phone number format:**
   - Must be in E.164 format: +[country_code][number]
   - Example: +919876543210 (India), +14155551234 (US)

3. **Check provider logs:**
   - Twilio: Check [Twilio Console Logs](https://console.twilio.com)
   - MSG91: Check MSG91 dashboard
   - TextLocal: Check TextLocal reports

### WhatsApp Not Sending

1. **Twilio Sandbox:**
   - Users must join sandbox first: Send "join <sandbox-word>" to the WhatsApp number
   - For production: Apply for WhatsApp Business API

2. **Official API:**
   - Ensure business is verified
   - Phone number is approved
   - Access token is valid
   - Webhook is configured

### No Phone Numbers in Database

- Ensure students have parent_phone or guardian_phone fields populated
- Update student records in Django Admin or through frontend

---

##  Security Best Practices

1. **Never commit .env file to version control**
   ```bash
   echo ".env" >> .gitignore
   ```

2. **Use environment variables in production**
   - Set variables in your hosting platform (Heroku, AWS, etc.)

3. **Rotate API keys regularly**

4. **Monitor usage:**
   - Set up billing alerts in provider dashboards
   - Track message logs for abuse

---

##  Cost Estimation

### Twilio (Approximate)
- SMS: \$ .0075 per message (US/India)
- WhatsApp: \$ .005 per message

### MSG91
- SMS: 0.15 - 0.25 per message (India)
- Lower rates for bulk purchases

### TextLocal
- SMS: £0.04 per message (UK)
- Volume discounts available

**Example:** 
- 500 students with defaulters = 200 messages/month
- Twilio cost: ~\$1.50/month
- MSG91 cost: ~40/month

---

##  Code Reference

### Service Files
- ackend/communication/services/sms_service.py - SMS wrapper
- ackend/communication/services/whatsapp_service.py - WhatsApp wrapper

### Views
- ackend/fees/views.py - API endpoints for sending reminders

### Tasks
- ackend/fees/tasks.py - Celery background tasks

### Frontend
- rontend/src/pages/fees/FeeDefaulters.tsx - UI component
- rontend/src/pages/fees/FeeDefaulters.css - Styles

---

##  Testing Checklist

- [ ] Environment variables configured
- [ ] SMS provider credentials verified
- [ ] WhatsApp provider credentials verified
- [ ] Celery worker running
- [ ] Student phone numbers populated
- [ ] Test send to single defaulter
- [ ] Test bulk send to selected defaulters
- [ ] Test bulk send to all defaulters
- [ ] Verify message logs in database
- [ ] Check provider dashboard for delivery status
- [ ] Test with different notification types (SMS/WhatsApp/Both)

---

##  Success!

You've successfully set up SMS and WhatsApp notifications for fee reminders! 

For support or questions:
- Check Django logs: 	ail -f logs/django.log
- Review Celery logs: 	ail -f logs/celery.log
- Contact support team

---

##  Next Steps

Consider implementing:
1. Customizable message templates in frontend
2. Multi-language support
3. Notification preferences per student
4. SMS/WhatsApp delivery reports dashboard
5. A/B testing different message formats
6. Rich media support (images, PDFs) in WhatsApp
