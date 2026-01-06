"""
Unisender Extension - Email Newsletter Integration

Подписка и отписка от рассылки через Unisender API.
"""

import json
import os
from typing import Optional
from urllib.parse import urlencode

import requests


# =============================================================================
# CONFIGURATION
# =============================================================================

UNISENDER_API_URL = "https://api.unisender.com/ru/api"


def get_api_key() -> str:
    """Get Unisender API key."""
    api_key = os.environ.get("UNISENDER_API_KEY", "")
    if not api_key:
        raise ValueError("UNISENDER_API_KEY not configured")
    return api_key


def get_list_id() -> str:
    """Get default list ID."""
    list_id = os.environ.get("UNISENDER_LIST_ID", "")
    if not list_id:
        raise ValueError("UNISENDER_LIST_ID not configured")
    return list_id


# =============================================================================
# CORS HELPERS
# =============================================================================

def get_cors_headers() -> dict:
    allowed_origins = os.environ.get("ALLOWED_ORIGINS", "*")
    return {
        "Access-Control-Allow-Origin": allowed_origins,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }


def cors_response(status: int, body: dict) -> dict:
    return {
        "statusCode": status,
        "headers": {**get_cors_headers(), "Content-Type": "application/json"},
        "body": json.dumps(body),
    }


def options_response() -> dict:
    return {
        "statusCode": 204,
        "headers": get_cors_headers(),
        "body": "",
    }


# =============================================================================
# UNISENDER API
# =============================================================================

def subscribe_contact(
    email: str,
    name: Optional[str] = None,
    list_id: Optional[str] = None,
    tags: Optional[str] = None,
    double_optin: int = 3
) -> dict:
    """
    Subscribe contact to Unisender list.

    double_optin values:
    - 0: send confirmation email
    - 3: add with status "new" without email (default)
    - 4: auto-detect based on contact existence
    """
    api_key = get_api_key()
    target_list_id = list_id or get_list_id()

    params = {
        "format": "json",
        "api_key": api_key,
        "list_ids": target_list_id,
        "fields[email]": email,
        "double_optin": double_optin,
        "overwrite": 1,
    }

    if name:
        params["fields[Name]"] = name

    if tags:
        params["tags"] = tags

    response = requests.post(
        f"{UNISENDER_API_URL}/subscribe",
        data=params,
        timeout=10
    )

    return response.json()


def unsubscribe_contact(email: str, list_id: Optional[str] = None) -> dict:
    """Unsubscribe contact from Unisender list."""
    api_key = get_api_key()

    params = {
        "format": "json",
        "api_key": api_key,
        "contact_type": "email",
        "contact": email,
    }

    if list_id:
        params["list_ids"] = list_id

    response = requests.post(
        f"{UNISENDER_API_URL}/unsubscribe",
        data=params,
        timeout=10
    )

    return response.json()


# =============================================================================
# ACTION HANDLERS
# =============================================================================

def handle_subscribe(body: dict) -> dict:
    """
    POST ?action=subscribe
    Subscribe email to newsletter.
    """
    email = body.get("email", "").strip().lower()
    name = body.get("name", "").strip()
    list_id = body.get("list_id")
    tags = body.get("tags")

    if not email:
        return cors_response(400, {"error": "Email is required"})

    if "@" not in email or "." not in email:
        return cors_response(400, {"error": "Invalid email format"})

    result = subscribe_contact(
        email=email,
        name=name if name else None,
        list_id=list_id,
        tags=tags
    )

    if "error" in result:
        return cors_response(400, {
            "error": result.get("error", "Subscribe failed"),
            "code": result.get("code")
        })

    return cors_response(200, {
        "success": True,
        "person_id": result.get("result", {}).get("person_id")
    })


def handle_unsubscribe(body: dict) -> dict:
    """
    POST ?action=unsubscribe
    Unsubscribe email from newsletter.
    """
    email = body.get("email", "").strip().lower()
    list_id = body.get("list_id")

    if not email:
        return cors_response(400, {"error": "Email is required"})

    result = unsubscribe_contact(email=email, list_id=list_id)

    if "error" in result:
        # "not found" is not really an error for unsubscribe
        if "not found" in result.get("error", "").lower():
            return cors_response(200, {"success": True, "message": "Already unsubscribed"})

        return cors_response(400, {
            "error": result.get("error", "Unsubscribe failed"),
            "code": result.get("code")
        })

    return cors_response(200, {"success": True})


# =============================================================================
# MAIN HANDLER
# =============================================================================

def handler(event: dict, context) -> dict:
    """Main entry point."""
    method = event.get("httpMethod", "GET")

    if method == "OPTIONS":
        return options_response()

    params = event.get("queryStringParameters") or {}
    action = params.get("action", "")

    body = {}
    if method == "POST":
        raw_body = event.get("body", "{}")
        try:
            body = json.loads(raw_body) if raw_body else {}
        except json.JSONDecodeError:
            return cors_response(400, {"error": "Invalid JSON"})

    if action == "subscribe" and method == "POST":
        return handle_subscribe(body)
    elif action == "unsubscribe" and method == "POST":
        return handle_unsubscribe(body)
    else:
        return cors_response(400, {"error": f"Unknown action: {action}"})
