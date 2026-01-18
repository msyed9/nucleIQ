"""
Push Notification Service - Firebase Cloud Messaging (FCM)
Handles device registration, token management, and push notification sending
"""

import logging
from typing import List, Dict, Optional
from django.conf import settings

logger = logging.getLogger(__name__)


class FCMService:
    """
    Firebase Cloud Messaging service for sending push notifications.
    Supports both individual and topic-based notifications.
    """
    
    def __init__(self):
        self.initialized = False
        self._initialize_firebase()
    
    def _initialize_firebase(self):
        """Initialize Firebase Admin SDK if credentials are configured."""
        try:
            import firebase_admin
            from firebase_admin import credentials
            
            # Check if already initialized
            try:
                firebase_admin.get_app()
                self.initialized = True
                return
            except ValueError:
                pass
            
            # Try to initialize with credentials
            cred_path = getattr(settings, 'FIREBASE_CREDENTIALS_PATH', None)
            
            if cred_path:
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
                self.initialized = True
                logger.info("Firebase Admin SDK initialized successfully")
            else:
                logger.warning("FIREBASE_CREDENTIALS_PATH not configured. Push notifications disabled.")
                
        except ImportError:
            logger.warning("firebase-admin package not installed. Push notifications disabled.")
        except Exception as e:
            logger.error(f"Failed to initialize Firebase: {str(e)}")
    
    def send_notification(
        self,
        token: str,
        title: str,
        body: str,
        data: Optional[Dict] = None,
        image_url: Optional[str] = None,
    ) -> Dict:
        """
        Send a push notification to a single device.
        
        Args:
            token: FCM device token
            title: Notification title
            body: Notification body
            data: Optional data payload
            image_url: Optional notification image
            
        Returns:
            Dict with success status and message_id or error
        """
        if not self.initialized:
            return {'success': False, 'error': 'FCM not initialized'}
        
        try:
            from firebase_admin import messaging
            
            notification = messaging.Notification(
                title=title,
                body=body,
                image=image_url,
            )
            
            android_config = messaging.AndroidConfig(
                priority='high',
                notification=messaging.AndroidNotification(
                    icon='notification_icon',
                    color='#667eea',
                    sound='default',
                ),
            )
            
            apns_config = messaging.APNSConfig(
                payload=messaging.APNSPayload(
                    aps=messaging.Aps(
                        badge=1,
                        sound='default',
                    ),
                ),
            )
            
            message = messaging.Message(
                notification=notification,
                data=data or {},
                token=token,
                android=android_config,
                apns=apns_config,
            )
            
            response = messaging.send(message)
            logger.info(f"Successfully sent message: {response}")
            
            return {'success': True, 'message_id': response}
            
        except Exception as e:
            logger.error(f"Failed to send notification: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def send_multicast(
        self,
        tokens: List[str],
        title: str,
        body: str,
        data: Optional[Dict] = None,
        image_url: Optional[str] = None,
    ) -> Dict:
        """
        Send a push notification to multiple devices.
        
        Args:
            tokens: List of FCM device tokens (max 500)
            title: Notification title
            body: Notification body
            data: Optional data payload
            image_url: Optional notification image
            
        Returns:
            Dict with success count, failure count, and failed tokens
        """
        if not self.initialized:
            return {'success': False, 'error': 'FCM not initialized'}
        
        if not tokens:
            return {'success': True, 'sent': 0, 'failed': 0}
        
        # FCM allows max 500 tokens per multicast
        if len(tokens) > 500:
            tokens = tokens[:500]
            logger.warning("Truncated tokens list to 500 (FCM limit)")
        
        try:
            from firebase_admin import messaging
            
            notification = messaging.Notification(
                title=title,
                body=body,
                image=image_url,
            )
            
            message = messaging.MulticastMessage(
                notification=notification,
                data=data or {},
                tokens=tokens,
            )
            
            response = messaging.send_multicast(message)
            
            # Collect failed tokens for cleanup
            failed_tokens = []
            for idx, result in enumerate(response.responses):
                if not result.success:
                    failed_tokens.append(tokens[idx])
                    logger.warning(f"Failed to send to token: {result.exception}")
            
            return {
                'success': True,
                'sent': response.success_count,
                'failed': response.failure_count,
                'failed_tokens': failed_tokens,
            }
            
        except Exception as e:
            logger.error(f"Failed to send multicast: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def send_to_topic(
        self,
        topic: str,
        title: str,
        body: str,
        data: Optional[Dict] = None,
        image_url: Optional[str] = None,
    ) -> Dict:
        """
        Send a push notification to a topic.
        
        Args:
            topic: Topic name (e.g., 'school_announcements', 'class_5_updates')
            title: Notification title
            body: Notification body
            data: Optional data payload
            image_url: Optional notification image
            
        Returns:
            Dict with success status and message_id or error
        """
        if not self.initialized:
            return {'success': False, 'error': 'FCM not initialized'}
        
        try:
            from firebase_admin import messaging
            
            notification = messaging.Notification(
                title=title,
                body=body,
                image=image_url,
            )
            
            message = messaging.Message(
                notification=notification,
                data=data or {},
                topic=topic,
            )
            
            response = messaging.send(message)
            logger.info(f"Successfully sent to topic {topic}: {response}")
            
            return {'success': True, 'message_id': response}
            
        except Exception as e:
            logger.error(f"Failed to send to topic: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def subscribe_to_topic(self, tokens: List[str], topic: str) -> Dict:
        """
        Subscribe devices to a topic.
        
        Args:
            tokens: List of FCM device tokens
            topic: Topic name
            
        Returns:
            Dict with success count and failure count
        """
        if not self.initialized:
            return {'success': False, 'error': 'FCM not initialized'}
        
        try:
            from firebase_admin import messaging
            
            response = messaging.subscribe_to_topic(tokens, topic)
            
            return {
                'success': True,
                'subscribed': response.success_count,
                'failed': response.failure_count,
            }
            
        except Exception as e:
            logger.error(f"Failed to subscribe to topic: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def unsubscribe_from_topic(self, tokens: List[str], topic: str) -> Dict:
        """
        Unsubscribe devices from a topic.
        
        Args:
            tokens: List of FCM device tokens
            topic: Topic name
            
        Returns:
            Dict with success count and failure count
        """
        if not self.initialized:
            return {'success': False, 'error': 'FCM not initialized'}
        
        try:
            from firebase_admin import messaging
            
            response = messaging.unsubscribe_from_topic(tokens, topic)
            
            return {
                'success': True,
                'unsubscribed': response.success_count,
                'failed': response.failure_count,
            }
            
        except Exception as e:
            logger.error(f"Failed to unsubscribe from topic: {str(e)}")
            return {'success': False, 'error': str(e)}


# Singleton instance
fcm_service = FCMService()


def send_push_notification(
    user_id: str,
    title: str,
    body: str,
    data: Optional[Dict] = None,
    image_url: Optional[str] = None,
) -> Dict:
    """
    Send push notification to a user by their ID.
    Looks up all registered device tokens for the user.
    
    Args:
        user_id: User ID
        title: Notification title
        body: Notification body
        data: Optional data payload
        image_url: Optional notification image
        
    Returns:
        Dict with success status
    """
    from .models import DeviceToken
    
    tokens = DeviceToken.objects.filter(
        user_id=user_id,
        is_active=True
    ).values_list('token', flat=True)
    
    tokens_list = list(tokens)
    
    if not tokens_list:
        return {'success': False, 'error': 'No registered devices for user'}
    
    return fcm_service.send_multicast(
        tokens=tokens_list,
        title=title,
        body=body,
        data=data,
        image_url=image_url,
    )


def send_bulk_push_notification(
    user_ids: List[str],
    title: str,
    body: str,
    data: Optional[Dict] = None,
    image_url: Optional[str] = None,
) -> Dict:
    """
    Send push notification to multiple users.
    
    Args:
        user_ids: List of user IDs
        title: Notification title
        body: Notification body
        data: Optional data payload
        image_url: Optional notification image
        
    Returns:
        Dict with success status and counts
    """
    from .models import DeviceToken
    
    tokens = DeviceToken.objects.filter(
        user_id__in=user_ids,
        is_active=True
    ).values_list('token', flat=True)
    
    tokens_list = list(tokens)
    
    if not tokens_list:
        return {'success': False, 'error': 'No registered devices for users'}
    
    return fcm_service.send_multicast(
        tokens=tokens_list,
        title=title,
        body=body,
        data=data,
        image_url=image_url,
    )
