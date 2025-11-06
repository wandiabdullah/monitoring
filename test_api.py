#!/usr/bin/env python3
"""
Quick test script to verify API endpoints return JSON
"""
import requests
import json

BASE_URL = "http://localhost:5000"

def test_login():
    """Test login and get session"""
    print("=" * 60)
    print("Testing Login...")
    print("=" * 60)
    
    response = requests.post(
        f"{BASE_URL}/api/login",
        json={"username": "admin", "password": "admin123"},
        headers={"Content-Type": "application/json"}
    )
    
    print(f"Status: {response.status_code}")
    print(f"Content-Type: {response.headers.get('Content-Type')}")
    print(f"Response: {response.text[:200]}")
    
    if response.status_code == 200:
        print("✓ Login successful")
        return response.cookies
    else:
        print("✗ Login failed")
        return None

def test_get_hosts(cookies):
    """Test GET /api/hosts"""
    print("\n" + "=" * 60)
    print("Testing GET /api/hosts...")
    print("=" * 60)
    
    response = requests.get(
        f"{BASE_URL}/api/hosts",
        cookies=cookies,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"Status: {response.status_code}")
    print(f"Content-Type: {response.headers.get('Content-Type')}")
    print(f"Response: {response.text[:500]}")
    
    # Check if response is JSON
    try:
        data = response.json()
        print(f"✓ Valid JSON response with {len(data)} hosts")
        return True
    except json.JSONDecodeError as e:
        print(f"✗ Invalid JSON: {e}")
        print(f"Response starts with: {response.text[:100]}")
        return False

def test_get_groups(cookies):
    """Test GET /api/groups"""
    print("\n" + "=" * 60)
    print("Testing GET /api/groups...")
    print("=" * 60)
    
    response = requests.get(
        f"{BASE_URL}/api/groups",
        cookies=cookies,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"Status: {response.status_code}")
    print(f"Content-Type: {response.headers.get('Content-Type')}")
    print(f"Response: {response.text[:500]}")
    
    # Check if response is JSON
    try:
        data = response.json()
        print(f"✓ Valid JSON response with {len(data)} groups")
        return True
    except json.JSONDecodeError as e:
        print(f"✗ Invalid JSON: {e}")
        return False

def test_add_host(cookies):
    """Test POST /api/hosts"""
    print("\n" + "=" * 60)
    print("Testing POST /api/hosts...")
    print("=" * 60)
    
    payload = {
        "hostname": "test-server-01",
        "ip_address": "192.168.1.100",
        "description": "Test server",
        "group_id": None,
        "enable_key_mapping": True
    }
    
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    response = requests.post(
        f"{BASE_URL}/api/hosts",
        json=payload,
        cookies=cookies,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"Status: {response.status_code}")
    print(f"Content-Type: {response.headers.get('Content-Type')}")
    print(f"Response: {response.text[:500]}")
    
    # Check if response is JSON
    try:
        data = response.json()
        if response.status_code == 201:
            print(f"✓ Host added successfully")
            print(f"  API Key: {data.get('api_key', 'N/A')[:20]}...")
            return True
        elif response.status_code == 409:
            print(f"⚠ Host already exists (expected if running test multiple times)")
            return True
        else:
            print(f"✗ Unexpected status code: {response.status_code}")
            return False
    except json.JSONDecodeError as e:
        print(f"✗ Invalid JSON: {e}")
        print(f"Response starts with: {response.text[:100]}")
        return False

if __name__ == "__main__":
    print("\n🔍 Testing Monitoring Dashboard API\n")
    
    # Test login
    cookies = test_login()
    if not cookies:
        print("\n❌ Login failed, cannot continue tests")
        exit(1)
    
    # Test API endpoints
    success = True
    success &= test_get_groups(cookies)
    success &= test_get_hosts(cookies)
    success &= test_add_host(cookies)
    
    print("\n" + "=" * 60)
    if success:
        print("✅ All tests passed!")
    else:
        print("❌ Some tests failed")
    print("=" * 60)
