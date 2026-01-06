"""
Firmanager API Tests
Tests for Products, Routes, Economy (Produsent), and Results endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://firmanager.preview.emergentagent.com')

class TestAuth:
    """Authentication tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@test.com",
            "password": "test"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        return data["access_token"]
    
    def test_login_success(self):
        """Test successful login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@test.com",
            "password": "test"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == "test@test.com"


class TestProducts:
    """Product CRUD tests with image_url support"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@test.com",
            "password": "test"
        })
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_get_products(self, auth_headers):
        """Test getting products list"""
        response = requests.get(f"{BASE_URL}/api/products", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} products")
    
    def test_create_product_with_image_url(self, auth_headers):
        """Test creating product with external image URL"""
        product_data = {
            "produktnr": "TEST-API-001",
            "navn": "API Test Product",
            "beskrivelse": "Product created via API test",
            "kategori": "Test",
            "kundepris": 999.99,
            "pa_lager": 50,
            "image_url": "https://via.placeholder.com/200"
        }
        response = requests.post(f"{BASE_URL}/api/products", json=product_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["produktnr"] == "TEST-API-001"
        assert data["image_url"] == "https://via.placeholder.com/200"
        print(f"Created product with ID: {data['id']}")
        return data["id"]
    
    def test_update_product_image_url(self, auth_headers):
        """Test updating product with new image URL"""
        # First create a product
        product_data = {
            "produktnr": "TEST-API-002",
            "navn": "API Test Product 2",
            "beskrivelse": "Product for update test",
            "kategori": "Test",
            "kundepris": 500,
            "pa_lager": 10,
            "image_url": ""
        }
        create_response = requests.post(f"{BASE_URL}/api/products", json=product_data, headers=auth_headers)
        assert create_response.status_code == 200
        product_id = create_response.json()["id"]
        
        # Update with image URL
        update_data = {
            "produktnr": "TEST-API-002",
            "navn": "API Test Product 2 Updated",
            "beskrivelse": "Product with updated image",
            "kategori": "Test",
            "kundepris": 500,
            "pa_lager": 10,
            "image_url": "https://via.placeholder.com/300"
        }
        update_response = requests.put(f"{BASE_URL}/api/products/{product_id}", json=update_data, headers=auth_headers)
        assert update_response.status_code == 200
        data = update_response.json()
        assert data["image_url"] == "https://via.placeholder.com/300"
        print(f"Updated product {product_id} with new image URL")


class TestRoutes:
    """Route planner tests with anleggsnr paste functionality"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@test.com",
            "password": "test"
        })
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_get_customers(self, auth_headers):
        """Test getting customers for route planning"""
        response = requests.get(f"{BASE_URL}/api/customers", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} customers")
        # Check that customers have anleggsnr field
        if len(data) > 0:
            assert "anleggsnr" in data[0]
    
    def test_create_route_from_anleggsnr(self, auth_headers):
        """Test creating route from anleggsnr list (geo-optimized)"""
        # Sample anleggsnr from test data
        route_data = {
            "date": "2026-01-06T00:00:00Z",
            "anleggsnr_list": ["63798", "63856", "63966"]
        }
        response = requests.post(f"{BASE_URL}/api/routes", json=route_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "anleggsnr_list" in data
        assert data["optimized"] == True
        print(f"Created route with {len(data['anleggsnr_list'])} stops, optimized: {data['optimized']}")
    
    def test_get_routes(self, auth_headers):
        """Test getting routes list"""
        response = requests.get(f"{BASE_URL}/api/routes", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} routes")


class TestEconomyProdusent:
    """Economy Produsent (supplier pricing) tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@test.com",
            "password": "test"
        })
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_get_supplier_pricing(self, auth_headers):
        """Test getting supplier pricing (Produsent) list"""
        response = requests.get(f"{BASE_URL}/api/economy/supplier-pricing", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} Produsent entries")
        # Check that entries have name field
        if len(data) > 0:
            assert "name" in data[0]
            assert "arbeidstid_rate" in data[0]
            assert "kjoretid_rate" in data[0]
            assert "km_rate" in data[0]
    
    def test_create_produsent(self, auth_headers):
        """Test creating new Produsent with name and rates"""
        produsent_data = {
            "name": "API Test Produsent",
            "arbeidstid_rate": 750.0,
            "kjoretid_rate": 400.0,
            "km_rate": 6.0
        }
        response = requests.post(f"{BASE_URL}/api/economy/supplier-pricing", json=produsent_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "API Test Produsent"
        assert data["arbeidstid_rate"] == 750.0
        assert data["kjoretid_rate"] == 400.0
        assert data["km_rate"] == 6.0
        print(f"Created Produsent with ID: {data['id']}")
        return data["id"]
    
    def test_update_produsent(self, auth_headers):
        """Test updating Produsent"""
        # First create a produsent
        create_data = {
            "name": "Update Test Produsent",
            "arbeidstid_rate": 500.0,
            "kjoretid_rate": 300.0,
            "km_rate": 4.0
        }
        create_response = requests.post(f"{BASE_URL}/api/economy/supplier-pricing", json=create_data, headers=auth_headers)
        assert create_response.status_code == 200
        produsent_id = create_response.json()["id"]
        
        # Update the produsent
        update_data = {
            "name": "Updated Produsent Name",
            "arbeidstid_rate": 800.0,
            "kjoretid_rate": 450.0,
            "km_rate": 7.0
        }
        update_response = requests.put(f"{BASE_URL}/api/economy/supplier-pricing/{produsent_id}", json=update_data, headers=auth_headers)
        assert update_response.status_code == 200
        data = update_response.json()
        assert data["name"] == "Updated Produsent Name"
        assert data["arbeidstid_rate"] == 800.0
        print(f"Updated Produsent {produsent_id}")


class TestServices:
    """Services tests with produsent_id linking"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@test.com",
            "password": "test"
        })
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_get_services(self, auth_headers):
        """Test getting services list"""
        response = requests.get(f"{BASE_URL}/api/economy/services", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} services")
    
    def test_create_service_with_produsent(self, auth_headers):
        """Test creating service with produsent_id"""
        # First get a produsent ID
        pricing_response = requests.get(f"{BASE_URL}/api/economy/supplier-pricing", headers=auth_headers)
        produsent_id = None
        if pricing_response.status_code == 200 and len(pricing_response.json()) > 0:
            produsent_id = pricing_response.json()[0]["id"]
        
        service_data = {
            "tjenestenr": "API-TEST-001",
            "tjeneste_navn": "API Test Service",
            "beskrivelse": "Service created via API test",
            "leverandor": "Test Leverandor",
            "produsent_id": produsent_id,
            "pris": 1500.0,
            "t1_ekstraservice": 500.0,
            "t2_ekstraservice_50": 750.0,
            "t3_ekstraservice_100": 1000.0,
            "t4_ekstraarbeid": 600.0,
            "t5_kjoretid": 400.0,
            "t6_km_godtgjorelse": 5.0
        }
        response = requests.post(f"{BASE_URL}/api/economy/services", json=service_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["tjenestenr"] == "API-TEST-001"
        assert data["produsent_id"] == produsent_id
        print(f"Created service with ID: {data['id']}, linked to produsent: {produsent_id}")


class TestResults:
    """Results page data tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@test.com",
            "password": "test"
        })
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_get_work_orders(self, auth_headers):
        """Test getting work orders for results calculation"""
        response = requests.get(f"{BASE_URL}/api/workorders", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} work orders")
    
    def test_get_employees(self, auth_headers):
        """Test getting employees for results calculation"""
        response = requests.get(f"{BASE_URL}/api/employees", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} employees")
    
    def test_get_internal_orders(self, auth_headers):
        """Test getting internal orders for results calculation"""
        response = requests.get(f"{BASE_URL}/api/internalorders", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} internal orders")


# Cleanup test data
class TestCleanup:
    """Cleanup test-created data"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@test.com",
            "password": "test"
        })
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_cleanup_test_products(self, auth_headers):
        """Delete test products"""
        response = requests.get(f"{BASE_URL}/api/products", headers=auth_headers)
        if response.status_code == 200:
            products = response.json()
            for product in products:
                if product["produktnr"].startswith("TEST-API-"):
                    delete_response = requests.delete(f"{BASE_URL}/api/products/{product['id']}", headers=auth_headers)
                    print(f"Deleted test product: {product['produktnr']}")
    
    def test_cleanup_test_services(self, auth_headers):
        """Delete test services"""
        response = requests.get(f"{BASE_URL}/api/economy/services", headers=auth_headers)
        if response.status_code == 200:
            services = response.json()
            for service in services:
                if service["tjenestenr"].startswith("API-TEST-"):
                    delete_response = requests.delete(f"{BASE_URL}/api/economy/services/{service['id']}", headers=auth_headers)
                    print(f"Deleted test service: {service['tjenestenr']}")
