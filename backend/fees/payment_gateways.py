"""
Payment Gateway Integration Service
Supports Razorpay, PhonePe, and Google Pay (via UPI)
Generates QR codes and payment links for fee collection
"""

import logging
import hashlib
import hmac
import base64
import json
import uuid
import qrcode
from io import BytesIO
from typing import Dict, Optional, Tuple
from decimal import Decimal
from django.conf import settings
from django.core.files.base import ContentFile
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class PaymentGatewayService:
    """
    Unified payment gateway service supporting multiple providers.
    Handles payment creation, verification, and QR code generation.
    """
    
    GATEWAY_RAZORPAY = 'razorpay'
    GATEWAY_PHONEPE = 'phonepe'
    GATEWAY_GOOGLEPAY = 'googlepay'
    GATEWAY_UPI = 'upi'  # Generic UPI for any app
    
    def __init__(self, tenant=None):
        self.tenant = tenant
        self._razorpay_client = None
        self._phonepe_initialized = False
        self._load_credentials()
    
    def _load_credentials(self):
        """Load payment gateway credentials from tenant settings or env"""
        if self.tenant:
            # Try to get tenant-specific credentials
            gateway_settings = getattr(self.tenant, 'payment_gateway_settings', {}) or {}
        else:
            gateway_settings = {}
        
        # Razorpay credentials
        self.razorpay_key_id = gateway_settings.get('razorpay_key_id') or getattr(settings, 'RAZORPAY_KEY_ID', '')
        self.razorpay_key_secret = gateway_settings.get('razorpay_key_secret') or getattr(settings, 'RAZORPAY_KEY_SECRET', '')
        
        # PhonePe credentials
        self.phonepe_merchant_id = gateway_settings.get('phonepe_merchant_id') or getattr(settings, 'PHONEPE_MERCHANT_ID', '')
        self.phonepe_salt_key = gateway_settings.get('phonepe_salt_key') or getattr(settings, 'PHONEPE_SALT_KEY', '')
        self.phonepe_salt_index = gateway_settings.get('phonepe_salt_index') or getattr(settings, 'PHONEPE_SALT_INDEX', '1')
        self.phonepe_env = gateway_settings.get('phonepe_env') or getattr(settings, 'PHONEPE_ENV', 'SANDBOX')
        
        # UPI VPA (common for Google Pay/PhonePe direct UPI)
        self.upi_vpa = gateway_settings.get('upi_vpa') or getattr(settings, 'SCHOOL_UPI_VPA', '')
        self.school_name = gateway_settings.get('school_name') or getattr(settings, 'SCHOOL_NAME', 'School')
    
    def _get_razorpay_client(self):
        """Initialize Razorpay client lazily"""
        if self._razorpay_client is None and self.razorpay_key_id and self.razorpay_key_secret:
            try:
                import razorpay
                self._razorpay_client = razorpay.Client(auth=(self.razorpay_key_id, self.razorpay_key_secret))
            except Exception as e:
                logger.error(f"Failed to initialize Razorpay client: {e}")
        return self._razorpay_client
    
    # ========================
    # Payment Order Creation
    # ========================
    
    def create_payment_order(
        self,
        amount: Decimal,
        currency: str = 'INR',
        student_id: str = None,
        invoice_id: str = None,
        description: str = 'Fee Payment',
        gateway: str = None,
        customer_details: Dict = None,
    ) -> Dict:
        """
        Create a payment order with the specified gateway.
        
        Args:
            amount: Payment amount
            currency: Currency code (default INR)
            student_id: Student ID for tracking
            invoice_id: Invoice ID for tracking
            description: Payment description
            gateway: Payment gateway to use
            customer_details: Customer info (name, email, phone)
        
        Returns:
            Dict with order details including payment link/QR
        """
        gateway = gateway or self.GATEWAY_RAZORPAY
        
        # Convert amount to paise for INR
        amount_in_paise = int(amount * 100)
        
        # Generate unique transaction ID
        txn_id = f"TXN{uuid.uuid4().hex[:12].upper()}"
        
        result = {
            'transaction_id': txn_id,
            'amount': float(amount),
            'currency': currency,
            'gateway': gateway,
            'status': 'pending',
            'student_id': student_id,
            'invoice_id': invoice_id,
        }
        
        try:
            if gateway == self.GATEWAY_RAZORPAY:
                result.update(self._create_razorpay_order(amount_in_paise, currency, txn_id, customer_details))
            elif gateway == self.GATEWAY_PHONEPE:
                result.update(self._create_phonepe_order(amount_in_paise, txn_id, description, customer_details))
            elif gateway in [self.GATEWAY_GOOGLEPAY, self.GATEWAY_UPI]:
                result.update(self._create_upi_intent(amount, description, txn_id))
            else:
                raise ValueError(f"Unsupported gateway: {gateway}")
                
        except Exception as e:
            logger.error(f"Payment order creation failed: {e}")
            result['status'] = 'failed'
            result['error'] = str(e)
        
        return result
    
    def _create_razorpay_order(self, amount_paise: int, currency: str, txn_id: str, customer_details: Dict = None) -> Dict:
        """Create Razorpay payment order"""
        client = self._get_razorpay_client()
        if not client:
            raise Exception("Razorpay client not initialized. Check credentials.")
        
        order_data = {
            'amount': amount_paise,
            'currency': currency,
            'receipt': txn_id,
            'notes': {
                'transaction_id': txn_id,
            }
        }
        
        order = client.order.create(data=order_data)
        
        # Create payment link for easy sharing
        payment_link_data = {
            'amount': amount_paise,
            'currency': currency,
            'description': f"Fee Payment - {txn_id}",
            'expire_by': int((datetime.now() + timedelta(days=7)).timestamp()),
            'reference_id': txn_id,
            'notify': {
                'sms': bool(customer_details and customer_details.get('phone')),
                'email': bool(customer_details and customer_details.get('email')),
            },
        }
        
        if customer_details:
            payment_link_data['customer'] = {
                'name': customer_details.get('name', ''),
                'email': customer_details.get('email', ''),
                'contact': customer_details.get('phone', ''),
            }
        
        try:
            payment_link = client.payment_link.create(payment_link_data)
            short_url = payment_link.get('short_url')
        except Exception as e:
            logger.warning(f"Could not create Razorpay payment link: {e}")
            short_url = None
        
        return {
            'order_id': order['id'],
            'razorpay_key': self.razorpay_key_id,
            'payment_link': short_url,
            'qr_code': self._generate_qr_code(short_url) if short_url else None,
            'status': 'created',
        }
    
    def _create_phonepe_order(self, amount_paise: int, txn_id: str, description: str, customer_details: Dict = None) -> Dict:
        """Create PhonePe payment request"""
        import requests
        
        if not self.phonepe_merchant_id or not self.phonepe_salt_key:
            raise Exception("PhonePe credentials not configured")
        
        # Determine API URL based on environment
        if self.phonepe_env == 'PRODUCTION':
            base_url = 'https://api.phonepe.com/apis/hermes'
        else:
            base_url = 'https://api-preprod.phonepe.com/apis/pg-sandbox'
        
        # Prepare payload
        payload = {
            "merchantId": self.phonepe_merchant_id,
            "merchantTransactionId": txn_id,
            "merchantUserId": customer_details.get('phone', 'GUEST') if customer_details else 'GUEST',
            "amount": amount_paise,
            "redirectUrl": f"{settings.FRONTEND_URL}/fees/payment-callback?txn={txn_id}",
            "redirectMode": "POST",
            "callbackUrl": f"{settings.BACKEND_URL}/api/fees/webhooks/phonepe/",
            "paymentInstrument": {
                "type": "PAY_PAGE"
            }
        }
        
        # Encode payload
        payload_str = json.dumps(payload)
        payload_base64 = base64.b64encode(payload_str.encode()).decode()
        
        # Create checksum
        checksum_string = payload_base64 + "/pg/v1/pay" + self.phonepe_salt_key
        checksum = hashlib.sha256(checksum_string.encode()).hexdigest() + "###" + self.phonepe_salt_index
        
        # Make request
        headers = {
            "Content-Type": "application/json",
            "X-VERIFY": checksum
        }
        
        response = requests.post(
            f"{base_url}/pg/v1/pay",
            json={"request": payload_base64},
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                redirect_url = data.get('data', {}).get('instrumentResponse', {}).get('redirectInfo', {}).get('url')
                return {
                    'payment_link': redirect_url,
                    'qr_code': self._generate_qr_code(redirect_url) if redirect_url else None,
                    'phonepe_transaction_id': data.get('data', {}).get('merchantTransactionId'),
                    'status': 'created',
                }
        
        raise Exception(f"PhonePe order creation failed: {response.text}")
    
    def _create_upi_intent(self, amount: Decimal, description: str, txn_id: str) -> Dict:
        """
        Create UPI intent URL that works with any UPI app (PhonePe, GPay, Paytm, etc.)
        """
        if not self.upi_vpa:
            raise Exception("UPI VPA not configured")
        
        # Generate UPI URL
        upi_url = (
            f"upi://pay?"
            f"pa={self.upi_vpa}&"
            f"pn={self.school_name.replace(' ', '%20')}&"
            f"am={amount}&"
            f"cu=INR&"
            f"tn={description.replace(' ', '%20')}&"
            f"tr={txn_id}"
        )
        
        return {
            'upi_url': upi_url,
            'upi_vpa': self.upi_vpa,
            'payment_link': upi_url,  # UPI intent works as payment link on mobile
            'qr_code': self._generate_qr_code(upi_url),
            'status': 'created',
            'instructions': 'Scan QR code with any UPI app or click the link on mobile',
        }
    
    # ========================
    # QR Code Generation
    # ========================
    
    def _generate_qr_code(self, data: str, size: int = 300) -> str:
        """Generate QR code as base64 image"""
        try:
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=2,
            )
            qr.add_data(data)
            qr.make(fit=True)
            
            img = qr.make_image(fill_color="black", back_color="white")
            
            # Convert to base64
            buffer = BytesIO()
            img.save(buffer, format='PNG')
            buffer.seek(0)
            
            import base64
            img_base64 = base64.b64encode(buffer.getvalue()).decode()
            return f"data:image/png;base64,{img_base64}"
            
        except Exception as e:
            logger.error(f"QR code generation failed: {e}")
            return None
    
    def generate_school_payment_qr(
        self,
        student_name: str = None,
        amount: Decimal = None,
        description: str = 'Fee Payment',
    ) -> Dict:
        """
        Generate school's standard payment QR code.
        Can be used for fixed amount or dynamic amount payments.
        """
        if not self.upi_vpa:
            return {'error': 'UPI VPA not configured'}
        
        # Base UPI URL
        upi_params = [
            f"pa={self.upi_vpa}",
            f"pn={self.school_name.replace(' ', '%20')}",
            "cu=INR",
        ]
        
        if amount:
            upi_params.append(f"am={amount}")
        
        if student_name:
            desc = f"{description} - {student_name}"
        else:
            desc = description
        upi_params.append(f"tn={desc.replace(' ', '%20')}")
        
        upi_url = "upi://pay?" + "&".join(upi_params)
        
        return {
            'upi_url': upi_url,
            'upi_vpa': self.upi_vpa,
            'school_name': self.school_name,
            'qr_code': self._generate_qr_code(upi_url),
            'amount': float(amount) if amount else None,
        }
    
    # ========================
    # Payment Verification
    # ========================
    
    def verify_payment(self, gateway: str, payment_data: Dict) -> Tuple[bool, Dict]:
        """
        Verify payment callback/webhook data.
        
        Args:
            gateway: Payment gateway name
            payment_data: Data received from gateway callback
        
        Returns:
            Tuple of (is_valid, payment_details)
        """
        try:
            if gateway == self.GATEWAY_RAZORPAY:
                return self._verify_razorpay_payment(payment_data)
            elif gateway == self.GATEWAY_PHONEPE:
                return self._verify_phonepe_payment(payment_data)
            else:
                return False, {'error': f"Unsupported gateway: {gateway}"}
        except Exception as e:
            logger.error(f"Payment verification failed: {e}")
            return False, {'error': str(e)}
    
    def _verify_razorpay_payment(self, payment_data: Dict) -> Tuple[bool, Dict]:
        """Verify Razorpay payment signature"""
        client = self._get_razorpay_client()
        if not client:
            return False, {'error': 'Razorpay client not initialized'}
        
        order_id = payment_data.get('razorpay_order_id')
        payment_id = payment_data.get('razorpay_payment_id')
        signature = payment_data.get('razorpay_signature')
        
        if not all([order_id, payment_id, signature]):
            return False, {'error': 'Missing required payment data'}
        
        try:
            client.utility.verify_payment_signature({
                'razorpay_order_id': order_id,
                'razorpay_payment_id': payment_id,
                'razorpay_signature': signature,
            })
            
            # Fetch payment details
            payment = client.payment.fetch(payment_id)
            
            return True, {
                'payment_id': payment_id,
                'order_id': order_id,
                'amount': payment.get('amount', 0) / 100,
                'currency': payment.get('currency', 'INR'),
                'status': payment.get('status'),
                'method': payment.get('method'),
                'email': payment.get('email'),
                'contact': payment.get('contact'),
            }
            
        except Exception as e:
            return False, {'error': f"Signature verification failed: {e}"}
    
    def _verify_phonepe_payment(self, payment_data: Dict) -> Tuple[bool, Dict]:
        """Verify PhonePe payment callback"""
        response_code = payment_data.get('code')
        merchant_transaction_id = payment_data.get('merchantTransactionId')
        transaction_id = payment_data.get('transactionId')
        amount = payment_data.get('amount', 0)
        
        if response_code == 'PAYMENT_SUCCESS':
            return True, {
                'payment_id': transaction_id,
                'transaction_id': merchant_transaction_id,
                'amount': amount / 100,
                'currency': 'INR',
                'status': 'success',
            }
        else:
            return False, {
                'error': f"Payment failed with code: {response_code}",
                'transaction_id': merchant_transaction_id,
            }
    
    # ========================
    # WhatsApp Payment Links
    # ========================
    
    def generate_whatsapp_payment_message(
        self,
        student_name: str,
        amount: Decimal,
        due_date: str = None,
        invoice_number: str = None,
        payment_link: str = None,
        include_qr: bool = True,
    ) -> Dict:
        """
        Generate WhatsApp-ready payment reminder message with link.
        
        Returns dict with:
        - message: Formatted WhatsApp message
        - whatsapp_url: wa.me URL for direct sending
        - qr_code: Base64 QR code image (if include_qr=True)
        """
        # Generate UPI payment link if not provided
        if not payment_link and self.upi_vpa:
            txn_id = f"INV{uuid.uuid4().hex[:8].upper()}"
            upi_data = self._create_upi_intent(amount, f"Fee for {student_name}", txn_id)
            payment_link = upi_data.get('upi_url')
            qr_code = upi_data.get('qr_code')
        else:
            qr_code = self._generate_qr_code(payment_link) if include_qr and payment_link else None
        
        # Format message
        message_lines = [
            f"🏫 *{self.school_name}*",
            f"",
            f"Dear Parent,",
            f"",
            f"This is a reminder for fee payment:",
            f"",
            f"👤 *Student:* {student_name}",
            f"💰 *Amount:* ₹{amount:,.2f}",
        ]
        
        if invoice_number:
            message_lines.append(f"📄 *Invoice:* {invoice_number}")
        
        if due_date:
            message_lines.append(f"📅 *Due Date:* {due_date}")
        
        message_lines.extend([
            f"",
            f"*Pay Now:*",
            f"{payment_link}",
            f"",
            f"Or scan the QR code sent in the next message.",
            f"",
            f"You can pay using PhonePe, Google Pay, Paytm, or any UPI app.",
            f"",
            f"Thank you!",
        ])
        
        message = "\n".join(message_lines)
        
        return {
            'message': message,
            'payment_link': payment_link,
            'qr_code': qr_code if include_qr else None,
            'school_name': self.school_name,
        }


# Singleton instance (can be overridden with tenant-specific instance)
payment_gateway_service = PaymentGatewayService()
