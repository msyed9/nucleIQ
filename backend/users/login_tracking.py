from __future__ import annotations

from typing import Optional


def get_client_ip(request) -> Optional[str]:
    if not request:
        return None

    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()

    x_real_ip = request.META.get('HTTP_X_REAL_IP')
    if x_real_ip:
        return x_real_ip.strip()

    return request.META.get('REMOTE_ADDR')


def _parse_lat_lng(value: Optional[str]):
    if not value:
        return None, None
    try:
        lat_str, lng_str = value.split(',', 1)
        return lat_str.strip(), lng_str.strip()
    except Exception:
        return None, None


def get_location_metadata(request) -> dict:
    if not request:
        return {
            'country': '',
            'region': '',
            'city': '',
            'latitude': '',
            'longitude': '',
        }

    meta = request.META

    country = (
        meta.get('HTTP_X_APPENGINE_COUNTRY')
        or meta.get('HTTP_CF_IPCOUNTRY')
        or meta.get('HTTP_X_COUNTRY_CODE')
        or ''
    )
    region = (
        meta.get('HTTP_X_APPENGINE_REGION')
        or meta.get('HTTP_CF_REGION')
        or meta.get('HTTP_X_REGION')
        or ''
    )
    city = (
        meta.get('HTTP_X_APPENGINE_CITY')
        or meta.get('HTTP_CF_IPCITY')
        or meta.get('HTTP_X_CITY')
        or ''
    )

    latitude = ''
    longitude = ''
    lat_lng_raw = meta.get('HTTP_X_APPENGINE_CITYLATLONG') or meta.get('HTTP_X_CITY_LATLONG')
    lat, lng = _parse_lat_lng(lat_lng_raw)
    if lat:
        latitude = lat
    if lng:
        longitude = lng

    ip = get_client_ip(request)
    # If no headers and not localhost, leverage an IP API for the geo data
    if ip and ip not in ['127.0.0.1', '::1', 'localhost'] and not city and not country:
        try:
            import urllib.request
            import json
            # Fast external check (geojs)
            req = urllib.request.Request(f"https://get.geojs.io/v1/ip/geo/{ip}.json", headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=1.5) as response:
                if response.status == 200:
                    data = json.loads(response.read().decode())
                    country = data.get('country', country)
                    region = data.get('region', region)
                    city = data.get('city', city)
                    latitude = data.get('latitude', latitude)
                    longitude = data.get('longitude', longitude)
        except Exception as e:
            pass

    return {
        'country': country,
        'region': region,
        'city': city,
        'latitude': latitude,
        'longitude': longitude,
    }


def record_login_activity(user, request=None, login_method='legacy_jwt'):
    if not user:
        return

    from .models import LoginActivityLog

    ip_address = get_client_ip(request)
    forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR', '') if request else ''
    user_agent = request.META.get('HTTP_USER_AGENT', '') if request else ''
    location = get_location_metadata(request)

    LoginActivityLog.objects.create(
        user=user,
        tenant=getattr(user, 'tenant', None),
        email_snapshot=getattr(user, 'email', ''),
        ip_address=ip_address,
        forwarded_for=forwarded_for,
        country=location['country'],
        region=location['region'],
        city=location['city'],
        latitude=location['latitude'],
        longitude=location['longitude'],
        user_agent=user_agent,
        login_method=login_method,
    )
