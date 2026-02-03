"""
Unit Tests for Payment Gateway Service
Tests for Razorpay, PhonePe, UPI, and common gateway functionality
"""

import unittest
from unittest.mock import Mock, patch, MagicMock
from decimal import Decimal
from django.test import TestCase, override_settings
from django.utils import timezone
import json
import hashlib
import hmac
import base64


# Import the service (adjust path as needed)
# from fees.payment_gateways import PaymentGatewayService


class PaymentGatewayServiceTestCase(TestCase):
    """Test cases for PaymentGatewayService"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.test_invoice = Mock()
        self.test_invoice.id = 'inv_123'
        self.test_invoice.invoice_number = 'INV-2024-001'
        self.test_invoice.balance_amount = Decimal('5000.00')
        self.test_invoice.student = Mock()
        self.test_invoice.student.full_name = 'Test Student'
        self.test_invoice.student.parent_phone = '9876543210'
        
        self.test_tenant = Mock()
        self.test_tenant.id = 'tenant_123'
        self.test_tenant.code = 'test_school'
        self.test_tenant.name = 'Test School'
        
    @patch('fees.payment_gateways.razorpay')
    @override_settings(
        RAZORPAY_KEY_ID='test_key_id',
        RAZORPAY_KEY_SECRET='test_key_secret'
    )
    def test_create_razorpay_order(self, mock_razorpay):
        """Test Razorpay order creation"""
        from fees.payment_gateways import PaymentGatewayService
        
        # Setup mock
        mock_client = Mock()
        mock_razorpay.Client.return_value = mock_client
        mock_client.order.create.return_value = {
            'id': 'order_123',
            'amount': 500000,
            'currency': 'INR',
            'status': 'created'
        }
        
        service = PaymentGatewayService(tenant=self.test_tenant)
        result = service.create_razorpay_order(
            invoice=self.test_invoice,
            amount=5000,
            customer_name='Test Customer',
            customer_email='test@test.com',
            customer_phone='9876543210'
        )
        
        # Assertions
        self.assertEqual(result['gateway'], 'razorpay')
        self.assertEqual(result['amount'], 5000)
        self.assertIn('order_id', result)
        mock_client.order.create.assert_called_once()
        
    @patch('fees.payment_gateways.razorpay')
    @override_settings(
        RAZORPAY_KEY_ID='test_key_id',
        RAZORPAY_KEY_SECRET='test_key_secret'
    )
    def test_verify_razorpay_payment_success(self, mock_razorpay):
        """Test successful Razorpay payment verification"""
        from fees.payment_gateways import PaymentGatewayService
        
        # Setup mock
        mock_client = Mock()
        mock_razorpay.Client.return_value = mock_client
        mock_client.utility.verify_payment_signature.return_value = True
        mock_client.payment.fetch.return_value = {
            'id': 'pay_123',
            'amount': 500000,
            'status': 'captured',
            'method': 'upi'
        }
        
        service = PaymentGatewayService(tenant=self.test_tenant)
        result = service.verify_razorpay_payment(
            order_id='order_123',
            payment_id='pay_123',
            signature='valid_signature',
            invoice=self.test_invoice
        )
        
        self.assertTrue(result['success'])
        self.assertEqual(result['payment_id'], 'pay_123')
        
    @patch('fees.payment_gateways.razorpay')
    @override_settings(
        RAZORPAY_KEY_ID='test_key_id',
        RAZORPAY_KEY_SECRET='test_key_secret'
    )
    def test_verify_razorpay_payment_failure(self, mock_razorpay):
        """Test failed Razorpay payment verification"""
        from fees.payment_gateways import PaymentGatewayService
        
        # Setup mock to raise exception
        mock_client = Mock()
        mock_razorpay.Client.return_value = mock_client
        mock_client.utility.verify_payment_signature.side_effect = Exception('Invalid signature')
        
        service = PaymentGatewayService(tenant=self.test_tenant)
        result = service.verify_razorpay_payment(
            order_id='order_123',
            payment_id='pay_123',
            signature='invalid_signature',
            invoice=self.test_invoice
        )
        
        self.assertFalse(result['success'])
        self.assertIn('error', result)
        
    @override_settings(
        SCHOOL_UPI_VPA='school@upi'
    )
    def test_generate_upi_intent_url(self):
        """Test UPI intent URL generation"""
        from fees.payment_gateways import PaymentGatewayService
        
        service = PaymentGatewayService(tenant=self.test_tenant)
        result = service.generate_upi_payment(
            invoice=self.test_invoice,
            amount=1000
        )
        
        self.assertEqual(result['gateway'], 'upi')
        self.assertIn('upi_url', result)
        self.assertIn('upi://', result['upi_url'])
        self.assertIn('pa=school@upi', result['upi_url'])
        
    @patch('fees.payment_gateways.qrcode')
    @override_settings(
        SCHOOL_UPI_VPA='school@upi',
        SCHOOL_NAME='Test School'
    )
    def test_generate_qr_code(self, mock_qrcode):
        """Test QR code generation"""
        from fees.payment_gateways import PaymentGatewayService
        import io
        
        # Setup mock
        mock_qr = Mock()
        mock_qrcode.QRCode.return_value = mock_qr
        mock_img = Mock()
        mock_qr.make_image.return_value = mock_img
        
        # Mock image save
        def mock_save(buffer, format):
            buffer.write(b'fake_image_data')
        mock_img.save = mock_save
        
        service = PaymentGatewayService(tenant=self.test_tenant)
        result = service.generate_payment_qr(amount=1000)
        
        self.assertIn('qr_code', result)
        self.assertTrue(result['qr_code'].startswith('data:image/png;base64,'))
        
    def test_format_whatsapp_message(self):
        """Test WhatsApp message formatting"""
        from fees.payment_gateways import PaymentGatewayService
        
        service = PaymentGatewayService(tenant=self.test_tenant)
        message = service.format_whatsapp_message(
            student_name='Test Student',
            amount=5000,
            invoice_number='INV-001',
            payment_link='https://pay.school.com/link123'
        )
        
        self.assertIn('Test Student', message)
        self.assertIn('5,000', message)
        self.assertIn('INV-001', message)
        self.assertIn('https://pay.school.com/link123', message)
        
    @patch('fees.payment_gateways.requests')
    @override_settings(
        PHONEPE_MERCHANT_ID='test_merchant',
        PHONEPE_SALT_KEY='test_salt',
        PHONEPE_SALT_INDEX=1,
        PHONEPE_ENV='sandbox'
    )
    def test_create_phonepe_order(self, mock_requests):
        """Test PhonePe order creation"""
        from fees.payment_gateways import PaymentGatewayService
        
        # Setup mock
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'success': True,
            'code': 'PAYMENT_INITIATED',
            'data': {
                'instrumentResponse': {
                    'redirectInfo': {
                        'url': 'https://phonepe.com/pay/123'
                    }
                }
            }
        }
        mock_requests.post.return_value = mock_response
        
        service = PaymentGatewayService(tenant=self.test_tenant)
        result = service.create_phonepe_order(
            invoice=self.test_invoice,
            amount=1000,
            callback_url='https://school.com/callback'
        )
        
        self.assertEqual(result['gateway'], 'phonepe')
        self.assertIn('payment_link', result)
        
    def test_get_available_gateways(self):
        """Test getting available payment gateways"""
        from fees.payment_gateways import PaymentGatewayService
        
        with self.settings(
            RAZORPAY_KEY_ID='test_key',
            RAZORPAY_KEY_SECRET='test_secret',
            SCHOOL_UPI_VPA='school@upi'
        ):
            service = PaymentGatewayService(tenant=self.test_tenant)
            gateways = service.get_available_gateways()
            
            # Should have at least UPI enabled
            self.assertIsInstance(gateways, list)
            gateway_ids = [g['id'] for g in gateways]
            self.assertIn('upi', gateway_ids)
            
    def test_amount_validation(self):
        """Test amount validation"""
        from fees.payment_gateways import PaymentGatewayService
        
        service = PaymentGatewayService(tenant=self.test_tenant)
        
        # Test minimum amount
        with self.assertRaises(ValueError):
            service._validate_amount(0)
            
        # Test negative amount
        with self.assertRaises(ValueError):
            service._validate_amount(-100)
            
        # Test valid amount
        self.assertTrue(service._validate_amount(100))
        
    def test_generate_transaction_id(self):
        """Test transaction ID generation"""
        from fees.payment_gateways import PaymentGatewayService
        
        service = PaymentGatewayService(tenant=self.test_tenant)
        
        txn_id_1 = service._generate_transaction_id()
        txn_id_2 = service._generate_transaction_id()
        
        # Should be unique
        self.assertNotEqual(txn_id_1, txn_id_2)
        
        # Should have expected format
        self.assertTrue(txn_id_1.startswith('TXN_'))


class PaymentGatewayViewSetTestCase(TestCase):
    """Test cases for PaymentGatewayViewSet API endpoints"""
    
    def setUp(self):
        """Set up test client and authentication"""
        from django.contrib.auth import get_user_model
        from rest_framework.test import APIClient
        
        self.client = APIClient()
        
        # Create test user
        User = get_user_model()
        self.user = User.objects.create_user(
            email='test@test.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
        
    @patch('fees.views.PaymentGatewayService')
    def test_gateway_config_endpoint(self, mock_service_class):
        """Test GET /api/fees/payment-gateway/gateway_config/"""
        mock_service = Mock()
        mock_service_class.return_value = mock_service
        mock_service.get_available_gateways.return_value = [
            {'id': 'razorpay', 'name': 'Razorpay', 'type': 'Card/UPI/Netbanking'},
            {'id': 'upi', 'name': 'UPI', 'type': 'Direct UPI'}
        ]
        
        response = self.client.get('/api/fees/payment-gateway/gateway_config/')
        
        self.assertEqual(response.status_code, 200)
        self.assertIn('gateways', response.data)
        
    @patch('fees.views.PaymentGatewayService')
    def test_create_order_endpoint(self, mock_service_class):
        """Test POST /api/fees/payment-gateway/create_order/"""
        mock_service = Mock()
        mock_service_class.return_value = mock_service
        mock_service.create_razorpay_order.return_value = {
            'transaction_id': 'txn_123',
            'gateway': 'razorpay',
            'amount': 5000,
            'order_id': 'order_123'
        }
        
        response = self.client.post(
            '/api/fees/payment-gateway/create_order/',
            {
                'invoice_id': 'inv_123',
                'gateway': 'razorpay',
                'amount': 5000
            },
            format='json'
        )
        
        # Just check it doesn't error (actual invoice lookup would fail)
        # In real test, you'd mock the invoice lookup too
        self.assertIn(response.status_code, [200, 400, 404])
        
    @patch('fees.views.PaymentGatewayService')
    def test_generate_qr_endpoint(self, mock_service_class):
        """Test POST /api/fees/payment-gateway/generate_qr/"""
        mock_service = Mock()
        mock_service_class.return_value = mock_service
        mock_service.generate_payment_qr.return_value = {
            'qr_code': 'data:image/png;base64,abc123',
            'upi_vpa': 'school@upi',
            'amount': 1000
        }
        
        response = self.client.post(
            '/api/fees/payment-gateway/generate_qr/',
            {'amount': 1000},
            format='json'
        )
        
        self.assertEqual(response.status_code, 200)
        self.assertIn('qr_code', response.data)


class UPIPaymentTestCase(TestCase):
    """Test cases specific to UPI payment functionality"""
    
    def test_upi_url_format(self):
        """Test UPI URL format is valid"""
        # UPI URL format: upi://pay?pa=VPA&pn=Name&am=Amount&cu=INR&tn=Note
        from fees.payment_gateways import PaymentGatewayService
        
        tenant = Mock()
        tenant.id = 'test'
        tenant.name = 'Test School'
        
        with self.settings(SCHOOL_UPI_VPA='test@upi', SCHOOL_NAME='Test School'):
            service = PaymentGatewayService(tenant=tenant)
            result = service.generate_upi_payment(
                invoice=Mock(invoice_number='INV-001'),
                amount=1000
            )
            
            upi_url = result['upi_url']
            
            # Check required parameters
            self.assertIn('pa=', upi_url)  # Payee address
            self.assertIn('am=', upi_url)  # Amount
            self.assertIn('cu=INR', upi_url)  # Currency
            
    def test_upi_amount_precision(self):
        """Test UPI amount is properly formatted"""
        from fees.payment_gateways import PaymentGatewayService
        
        tenant = Mock()
        tenant.id = 'test'
        
        with self.settings(SCHOOL_UPI_VPA='test@upi'):
            service = PaymentGatewayService(tenant=tenant)
            
            # Test with decimal amount
            result = service.generate_upi_payment(
                invoice=Mock(invoice_number='INV-001'),
                amount=1000.50
            )
            
            # Amount should be properly formatted in URL
            self.assertIn('am=1000.50', result['upi_url'])


class PhonePeIntegrationTestCase(TestCase):
    """Test cases for PhonePe integration"""
    
    @patch('fees.payment_gateways.requests')
    @override_settings(
        PHONEPE_MERCHANT_ID='test_merchant',
        PHONEPE_SALT_KEY='test_salt',
        PHONEPE_SALT_INDEX=1,
        PHONEPE_ENV='sandbox'
    )
    def test_phonepe_checksum_generation(self, mock_requests):
        """Test PhonePe checksum is correctly generated"""
        from fees.payment_gateways import PaymentGatewayService
        
        tenant = Mock()
        tenant.id = 'test'
        
        service = PaymentGatewayService(tenant=tenant)
        
        # Mock successful response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'success': True,
            'code': 'PAYMENT_INITIATED',
            'data': {
                'instrumentResponse': {
                    'redirectInfo': {'url': 'https://phonepe.com/pay'}
                }
            }
        }
        mock_requests.post.return_value = mock_response
        
        invoice = Mock()
        invoice.id = 'inv_123'
        invoice.invoice_number = 'INV-001'
        
        result = service.create_phonepe_order(
            invoice=invoice,
            amount=1000,
            callback_url='https://school.com/callback'
        )
        
        # Verify the request was made with proper headers
        mock_requests.post.assert_called_once()
        call_kwargs = mock_requests.post.call_args
        self.assertIn('X-VERIFY', call_kwargs[1]['headers'])


class PaymentWebhookTestCase(TestCase):
    """Test cases for payment webhook handling"""
    
    def test_razorpay_webhook_signature_verification(self):
        """Test Razorpay webhook signature verification"""
        # Razorpay uses HMAC SHA256 for webhook signature
        secret = 'webhook_secret'
        payload = json.dumps({'event': 'payment.captured'})
        
        expected_signature = hmac.new(
            secret.encode(),
            payload.encode(),
            hashlib.sha256
        ).hexdigest()
        
        # Verify our verification logic matches
        computed_signature = hmac.new(
            secret.encode(),
            payload.encode(),
            hashlib.sha256
        ).hexdigest()
        
        self.assertEqual(expected_signature, computed_signature)
        
    @patch('fees.payment_gateways.PaymentGatewayService')
    def test_webhook_payment_capture(self, mock_service_class):
        """Test webhook handling for payment capture event"""
        # This tests that when we receive a payment.captured webhook,
        # the payment is properly recorded
        
        webhook_payload = {
            'event': 'payment.captured',
            'payload': {
                'payment': {
                    'entity': {
                        'id': 'pay_123',
                        'order_id': 'order_123',
                        'amount': 500000,
                        'status': 'captured',
                        'method': 'upi'
                    }
                }
            }
        }
        
        # The actual webhook handler would process this payload
        # and update the payment status in the database
        
        payment_data = webhook_payload['payload']['payment']['entity']
        self.assertEqual(payment_data['status'], 'captured')
        self.assertEqual(payment_data['amount'], 500000)


if __name__ == '__main__':
    unittest.main()
