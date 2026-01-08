# Student Communication System - Implementation Guide

## Overview
Complete SMS and Email notification system for student lifecycle events, integrated with Twilio and various email providers (AWS SES, SendGrid). All notifications run as background tasks via Celery to ensure non-blocking API performance.

## Architecture

### Components
1. **StudentNotificationService** - Core notification orchestration
2. **SMSService** - Twilio/MSG91 integration for SMS
3. **EmailService** - AWS SES/SendGrid integration for Email
4. **Celery Tasks** - Background notification processing
5. **REST API** - Parent notification endpoints

### Infrastructure
- **SMS Provider**: Twilio (primary), MSG91 (fallback)
- **Email Providers**: AWS SES (primary), SendGrid (fallback)
- **Task Queue**: Celery with Redis
- **Retry Logic**: Exponential backoff (3 retries max)

## Notification Types

### 1. Admission Confirmation
**Trigger**: New student enrollment
**Recipients**: All parent contacts (from ParentUser and Student model)
**Channels**: SMS + Email

**Example**:
```python
POST /api/students/{id}/send_admission_confirmation/

Response:
{
    "message": "Admission confirmation notification queued",
    "task_id": "abc123...",
    "student_id": 456
}
```

### 2. Fee Reminder
**Trigger**: Manual or scheduled (daily cron for overdue invoices)
**Recipients**: Parents
**Channels**: SMS + Email

**API Request**:
```python
POST /api/students/{id}/send_fee_reminder/
{
    "amount": 5000,
    "due_date": "2026-01-15",
    "invoice_number": "INV-2026-001"
}
```

**Scheduled Task**:
```python
# Celery Beat: Runs daily at 9 AM
send_daily_fee_reminders()
# Sends reminders for all invoices overdue by 3+ days
```

### 3. Absent Alert
**Trigger**: Manual or end-of-day batch
**Recipients**: Parents
**Channels**: SMS + Email

**API Request**:
```python
POST /api/students/{id}/send_absent_alert/
{
    "date": "2026-01-04",
    "reason": "No information provided"
}
```

**Scheduled Task**:
```python
# Celery Beat: Runs daily at 6 PM
send_absent_alerts_for_date(date='2026-01-04')
# Sends alerts for all absent students on given date
```

### 4. Exam Result Published
**Trigger**: Result declaration
**Recipients**: Parents
**Channels**: SMS + Email

**API Request**:
```python
POST /api/students/{id}/send_exam_result_notification/
{
    "exam_name": "Mid-Term Exam 2026",
    "percentage": 87.5,
    "grade": "A+"
}
```

### 5. Promotion Notification
**Trigger**: Class promotion completion
**Recipients**: Parents
**Channels**: SMS + Email

**API Request**:
```python
POST /api/students/{id}/send_promotion_notification/
{
    "from_class": "Class 9-A",
    "to_class": "Class 10-A",
    "academic_year": "2026-27"
}
```

### 6. Transfer Notification
**Trigger**: Student transfer request processed
**Recipients**: Parents
**Channels**: SMS + Email

**API Request**:
```python
POST /api/students/{id}/send_transfer_notification/
{
    "transfer_type": "inter_branch",
    "destination": "XYZ School, Downtown Branch",
    "effective_date": "2026-02-01"
}
```

### 7. Bulk Notification
**Trigger**: Manual bulk messaging
**Recipients**: Multiple students' parents
**Channels**: SMS + Email with template variables

**API Request**:
```python
POST /api/students/send_bulk_notification/
{
    "student_ids": [101, 102, 103, 104],
    "notification_type": "event_announcement",
    "sms_message": "Dear Parent of {{student_name}}, Annual Day on 15th Jan at {{school_name}}.",
    "email_subject": "Annual Day Invitation - {{school_name}}",
    "email_content": "<html>Dear Parent of <strong>{{student_name}}</strong> ({{admission_number}}), You are cordially invited...</html>"
}
```

**Supported Template Variables**:
- `{{student_name}}` - Full name
- `{{admission_number}}` - Admission number
- `{{class}}` - Current class
- `{{section}}` - Current section
- `{{school_name}}` - Tenant/school name

## File Structure

```
backend/
├── students/
│   ├── notifications.py          # StudentNotificationService (607 lines)
│   ├── tasks.py                  # Celery tasks (330 lines)
│   └── views.py                  # API endpoints (updated)
├── communication/
│   ├── models.py                 # CommunicationProvider, MessageTemplate, MessageLog
│   └── services.py               # SMSService, EmailService
└── requirements/
    └── prod.txt                  # celery==5.4.0, twilio==9.0.4
```

## Setup Instructions

### 1. Environment Variables
Create or update `.env` file:

```bash
# SMS Configuration (Twilio)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_FROM_NUMBER=+1234567890

# SMS Configuration (MSG91 - fallback)
MSG91_API_KEY=your_msg91_api_key
MSG91_SENDER_ID=SCHOOL

# Email Configuration (AWS SES)
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_SES_REGION=us-east-1
SES_FROM_EMAIL=notifications@yourschool.com

# Email Configuration (SendGrid - fallback)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=notifications@yourschool.com

# Celery Configuration
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

### 2. Database Setup
Run migrations (already created):
```bash
docker-compose exec backend python manage.py migrate communication
docker-compose exec backend python manage.py migrate students
```

### 3. Communication Provider Setup
Create provider configurations in Django admin:

**Twilio SMS Provider**:
```python
CommunicationProvider.objects.create(
    name='Twilio',
    provider_type='sms',
    is_active=True,
    api_key=os.getenv('TWILIO_ACCOUNT_SID'),
    api_secret=os.getenv('TWILIO_AUTH_TOKEN'),
    sender_id=os.getenv('TWILIO_FROM_NUMBER'),
    priority=1
)
```

**AWS SES Email Provider**:
```python
CommunicationProvider.objects.create(
    name='AWS SES',
    provider_type='email',
    is_active=True,
    api_key=os.getenv('AWS_ACCESS_KEY_ID'),
    api_secret=os.getenv('AWS_SECRET_ACCESS_KEY'),
    sender_id=os.getenv('SES_FROM_EMAIL'),
    priority=1
)
```

### 4. Message Templates
Create templates for customization:

**Fee Reminder Template**:
```python
MessageTemplate.objects.create(
    name='Fee Reminder',
    template_type='fee_reminder',
    content='Dear Parent, Fee payment of Rs.{{amount}} is due on {{due_date}} for {{student_name}}. Invoice: {{invoice_number}}. Please pay at earliest.',
    is_active=True
)
```

**Absent Alert Template**:
```python
MessageTemplate.objects.create(
    name='Absent Alert',
    template_type='absent_alert',
    content='Dear Parent, {{student_name}} was absent on {{date}}. {{reason}}. Please contact school for more information.',
    is_active=True
)
```

### 5. Celery Workers
Start Celery workers for background tasks:

**Development**:
```bash
docker-compose exec backend celery -A config worker -l info
```

**Production**:
```bash
docker-compose exec backend celery -A config worker -l info --concurrency=4
```

### 6. Celery Beat (Scheduled Tasks)
Start Celery Beat for scheduled notifications:

```bash
docker-compose exec backend celery -A config beat -l info
```

**Scheduled Tasks Configuration** (`config/celery.py`):
```python
from celery.schedules import crontab

app.conf.beat_schedule = {
    'send-daily-fee-reminders': {
        'task': 'students.tasks.send_daily_fee_reminders',
        'schedule': crontab(hour=9, minute=0),  # 9 AM daily
    },
    'send-absent-alerts': {
        'task': 'students.tasks.send_absent_alerts_for_date',
        'schedule': crontab(hour=18, minute=0),  # 6 PM daily
        'kwargs': {'date': datetime.now().strftime('%Y-%m-%d')}
    },
}
```

## Usage Examples

### Scenario 1: Send Admission Confirmation
```python
# After creating a new student
import requests

response = requests.post(
    'http://localhost:8000/api/students/456/send_admission_confirmation/',
    headers={'Authorization': 'Bearer <token>'}
)

# Response: Task queued for background processing
# Parents receive SMS and Email within seconds
```

### Scenario 2: Daily Fee Reminders
```python
# Celery Beat runs automatically at 9 AM
# Finds all overdue invoices and sends reminders

# Manual trigger (if needed):
from students.tasks import send_daily_fee_reminders
send_daily_fee_reminders.delay()
```

### Scenario 3: Bulk Event Announcement
```python
import requests

# Send to all Class 10 students
student_ids = [101, 102, 103, 104, 105]

response = requests.post(
    'http://localhost:8000/api/students/send_bulk_notification/',
    headers={'Authorization': 'Bearer <token>'},
    json={
        'student_ids': student_ids,
        'notification_type': 'event',
        'sms_message': 'Dear Parent of {{student_name}}, Sports Day on Jan 20th!',
        'email_subject': 'Sports Day Invitation',
        'email_content': '<h1>Sports Day</h1><p>Dear Parent of {{student_name}},...</p>'
    }
)
```

### Scenario 4: Check Task Status
```python
from celery.result import AsyncResult

task_id = 'abc123-def456-ghi789'
task_result = AsyncResult(task_id)

print(f"Task State: {task_result.state}")
print(f"Task Info: {task_result.info}")

# States: PENDING, STARTED, SUCCESS, FAILURE, RETRY
```

## Monitoring & Logs

### Message Logs
All sent messages are logged in `MessageLog` model:

```python
from communication.models import MessageLog

# Check recent SMS
recent_sms = MessageLog.objects.filter(
    message_type='sms',
    created_at__gte=datetime.now() - timedelta(days=7)
).order_by('-created_at')

# Check failed messages
failed = MessageLog.objects.filter(
    status='failed',
    created_at__gte=datetime.now() - timedelta(days=1)
)

# Success rate
total = MessageLog.objects.count()
success = MessageLog.objects.filter(status='sent').count()
success_rate = (success / total) * 100
```

### Celery Monitoring
Monitor task queue health:

```bash
# Check active tasks
docker-compose exec backend celery -A config inspect active

# Check scheduled tasks
docker-compose exec backend celery -A config inspect scheduled

# Check worker stats
docker-compose exec backend celery -A config inspect stats
```

### Flower (Optional)
Web-based Celery monitoring:

```bash
docker-compose exec backend celery -A config flower --port=5555
# Access at http://localhost:5555
```

## Error Handling

### Retry Logic
All notification tasks retry 3 times with exponential backoff:

```python
# Task fails -> Retry after 60s
# Second failure -> Retry after 120s (60 * 2^1)
# Third failure -> Retry after 240s (60 * 2^2)
# Final failure -> Mark as failed, log error
```

### Error Scenarios

1. **Invalid Phone Number**: Logged as failed, parent notified via email only
2. **SMS Provider Down**: Automatically switches to fallback provider (MSG91)
3. **Email Bounce**: Logged with bounce reason, admin alerted
4. **No Parent Contact**: Logged as skipped, admin dashboard shows alert
5. **Template Not Found**: Uses default hardcoded message

### Error Notifications
Admins receive alerts for:
- Daily failure rate > 10%
- Provider downtime > 5 minutes
- Missing required env variables

## Performance Optimization

### Best Practices
1. **Batch Processing**: Use `send_bulk_notification` for >10 students
2. **Template Caching**: Templates cached for 1 hour
3. **Connection Pooling**: Twilio client reused across requests
4. **Async Processing**: All notifications via Celery (non-blocking)
5. **Rate Limiting**: 100 SMS/minute per tenant (Twilio limit)

### Scaling
- **Horizontal**: Add more Celery workers
- **Vertical**: Increase worker concurrency
- **Sharding**: Separate queues per tenant for large deployments

## Security

### Data Protection
- API keys stored in environment variables
- Message logs encrypted at rest
- PII (phone, email) masked in logs
- RBAC: Only admins can send bulk notifications

### Compliance
- GDPR: Opt-out mechanism for parents
- TCPA: SMS only sent during 8 AM - 8 PM
- CAN-SPAM: Unsubscribe link in all emails

## API Reference

### Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/students/{id}/send_admission_confirmation/` | POST | Send admission confirmation |
| `/api/students/{id}/send_fee_reminder/` | POST | Send fee reminder |
| `/api/students/{id}/send_absent_alert/` | POST | Send absent alert |
| `/api/students/{id}/send_exam_result_notification/` | POST | Send exam result |
| `/api/students/send_bulk_notification/` | POST | Bulk notification |

### Response Format
All endpoints return:
```json
{
    "message": "Notification queued",
    "task_id": "unique-task-id",
    "student_id": 123
}
```

Status codes:
- `202 Accepted`: Task queued successfully
- `400 Bad Request`: Invalid parameters
- `404 Not Found`: Student not found
- `500 Internal Server Error`: System error

## Testing

### Manual Testing
```bash
# Test SMS connectivity
curl -X POST http://localhost:8000/api/students/1/send_admission_confirmation/ \
  -H "Authorization: Bearer <token>"

# Test bulk notification
curl -X POST http://localhost:8000/api/students/send_bulk_notification/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "student_ids": [1, 2, 3],
    "sms_message": "Test message for {{student_name}}",
    "email_subject": "Test",
    "email_content": "Test content"
  }'
```

### Unit Tests
```python
# tests/test_notifications.py
from students.notifications import StudentNotificationService

def test_send_admission_confirmation():
    service = StudentNotificationService(tenant_id=1)
    result = service.send_admission_confirmation(student_id=1)
    assert result['success'] == True
    assert 'sms' in result
    assert 'email' in result
```

## Troubleshooting

### Issue: SMS not delivered
**Check**:
1. Verify Twilio credentials in `.env`
2. Check `MessageLog` for error messages
3. Verify phone number format (+1234567890)
4. Check Twilio account balance

### Issue: Email not delivered
**Check**:
1. Verify SES/SendGrid credentials
2. Check spam folder
3. Verify domain verification (SES)
4. Check email quotas

### Issue: Task not processing
**Check**:
1. Celery worker running: `docker-compose ps backend`
2. Redis connection: `docker-compose ps redis`
3. Task queue: `celery -A config inspect active`
4. Logs: `docker-compose logs -f backend`

### Issue: Scheduled tasks not running
**Check**:
1. Celery Beat running
2. Timezone configuration in `settings.py`
3. Beat schedule in `config/celery.py`

## Cost Estimation

### SMS Costs (Twilio)
- **US/Canada**: $0.0079 per SMS
- **India**: $0.0055 per SMS
- **Monthly estimate** (500 students, 4 SMS/month): $11-15

### Email Costs (AWS SES)
- **First 62,000 emails/month**: Free
- **Additional**: $0.10 per 1,000 emails
- **Monthly estimate** (500 students, 10 emails/month): Free

### Infrastructure
- **Redis**: Free (included in Docker setup)
- **Celery Workers**: No additional cost

## Roadmap

### Phase 1 (Current)
✅ SMS/Email notifications
✅ Background task processing
✅ Retry logic
✅ Template system

### Phase 2 (Planned)
- WhatsApp Business API integration
- Push notifications (mobile app)
- Multi-language support
- A/B testing for message content

### Phase 3 (Future)
- AI-powered send time optimization
- Sentiment analysis on parent responses
- Two-way SMS conversations
- Voice call notifications

## Support

For issues or questions:
1. Check logs: `docker-compose logs -f backend`
2. Review `MessageLog` table for delivery status
3. Check Celery worker health
4. Review this documentation

## Implementation Complete ✅

All communication features are fully implemented and ready for production use.

**Key Files**:
- `backend/students/notifications.py` - Notification service
- `backend/students/tasks.py` - Celery background tasks
- `backend/students/views.py` - API endpoints
- `backend/communication/services.py` - SMS/Email services

**Next Steps**:
1. Configure environment variables
2. Set up communication providers in admin
3. Create message templates
4. Start Celery workers
5. Test notification endpoints
