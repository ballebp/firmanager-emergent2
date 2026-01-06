"""
Seed script for ServiceManager application with Norwegian test data
Multi-tenancy version: Creates two organizations (VMP and Biovac)
"""
import asyncio
import sys
import os
from datetime import datetime, timedelta
import random

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
import uuid

# Database connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'firmanager')

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Norwegian test data
NORWEGIAN_FIRST_NAMES = ["Ole", "Kari", "Per", "Anne", "Lars", "Ingrid", "Erik", "Marit", "Hans", "Liv"]
NORWEGIAN_LAST_NAMES = ["Hansen", "Olsen", "Johansen", "Larsen", "Andersen", "Pedersen", "Nilsen", "Kristiansen", "Jensen", "Karlsen"]
NORWEGIAN_CITIES = [
    ("Oslo", "0150"),
    ("Bergen", "5003"),
    ("Trondheim", "7010"),
    ("Stavanger", "4001"),
    ("Drammen", "3001"),
    ("Fredrikstad", "1601"),
    ("Kristiansand", "4601"),
    ("Sandnes", "4302"),
    ("Tromsø", "9001"),
    ("Sarpsborg", "1701")
]
NORWEGIAN_STREETS = ["Storgata", "Kirkegata", "Skole", "Høyveien", "Strand", "Havn", "Berg", "Dal", "Ås", "Skog"]
COMPANY_TYPES = ["AS", "Barnehage", "Skole", "Sykehjem", "Borettslag", "Bedrift", "Kontor"]
PRODUCT_CATEGORIES = ["Brannsikkerhet", "Ventilasjon", "Varme", "Kjøling", "Sanitær"]

async def seed_database():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("🗑️  Cleaning existing data...")
    collections = ['organizations', 'users', 'customers', 'employees', 'workorders', 'internalorders', 
                  'products', 'routes', 'hms_risk_assessments', 'hms_incidents', 
                  'hms_training', 'hms_equipment', 'payouts', 'services', 'supplier_pricing']
    
    for collection in collections:
        await db[collection].delete_many({})
    
    print("\n🏢 Creating organizations...")
    # Create VMP organization
    vmp_org_id = str(uuid.uuid4())
    vmp_org = {
        "id": vmp_org_id,
        "name": "VMP",
        "subscription_tier": "admin",
        "created_at": datetime.now().isoformat(),
        "trial_ends_at": None,
        "settings": {}
    }
    
    # Create Biovac organization
    biovac_org_id = str(uuid.uuid4())
    biovac_org = {
        "id": biovac_org_id,
        "name": "Biovac",
        "subscription_tier": "admin",
        "created_at": datetime.now().isoformat(),
        "trial_ends_at": None,
        "settings": {}
    }
    
    await db.organizations.insert_many([vmp_org, biovac_org])
    print(f"✅ Created 2 organizations: VMP and Biovac")
    
    print("\n👤 Creating users...")
    admin_password = pwd_context.hash("admin123")
    user_password = pwd_context.hash("user123")
    
    users = [
        # VMP Admin
        {
            "id": str(uuid.uuid4()),
            "email": "admin@vmp.no",
            "name": "VMP Admin",
            "organization_id": vmp_org_id,
            "role": "admin",
            "password_hash": admin_password,
            "created_at": datetime.now().isoformat()
        },
        # VMP Users
        {
            "id": str(uuid.uuid4()),
            "email": "user1@vmp.no",
            "name": "VMP User 1",
            "organization_id": vmp_org_id,
            "role": "user",
            "password_hash": user_password,
            "created_at": datetime.now().isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "email": "user2@vmp.no",
            "name": "VMP User 2",
            "organization_id": vmp_org_id,
            "role": "user",
            "password_hash": user_password,
            "created_at": datetime.now().isoformat()
        },
        # Biovac Admin
        {
            "id": str(uuid.uuid4()),
            "email": "admin@biovac.no",
            "name": "Biovac Admin",
            "organization_id": biovac_org_id,
            "role": "admin",
            "password_hash": admin_password,
            "created_at": datetime.now().isoformat()
        },
        # Biovac Users
        {
            "id": str(uuid.uuid4()),
            "email": "user1@biovac.no",
            "name": "Biovac User 1",
            "organization_id": biovac_org_id,
            "role": "user",
            "password_hash": user_password,
            "created_at": datetime.now().isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "email": "user2@biovac.no",
            "name": "Biovac User 2",
            "organization_id": biovac_org_id,
            "role": "user",
            "password_hash": user_password,
            "created_at": datetime.now().isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "email": "user3@biovac.no",
            "name": "Biovac User 3",
            "organization_id": biovac_org_id,
            "role": "user",
            "password_hash": user_password,
            "created_at": datetime.now().isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "email": "user4@biovac.no",
            "name": "Biovac User 4",
            "organization_id": biovac_org_id,
            "role": "user",
            "password_hash": user_password,
            "created_at": datetime.now().isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "email": "user5@biovac.no",
            "name": "Biovac User 5",
            "organization_id": biovac_org_id,
            "role": "user",
            "password_hash": user_password,
            "created_at": datetime.now().isoformat()
        }
    ]
    await db.users.insert_many(users)
    print(f"✅ Created {len(users)} users")
    print("   VMP: admin@vmp.no / admin123 (admin)")
    print("   VMP: user1@vmp.no, user2@vmp.no / user123")
    print("   Biovac: admin@biovac.no / admin123 (admin)")
    print("   Biovac: user1-5@biovac.no / user123")
    
    # Helper function to create data for an organization
    async def seed_organization_data(org_id, org_name, num_customers=15):
        print(f"\n📊 Seeding data for {org_name}...")
        
        print(f"  👷 Creating employees for {org_name}...")
        employees = []
        for i in range(random.randint(4, 8)):
            first_name = random.choice(NORWEGIAN_FIRST_NAMES)
            last_name = random.choice(NORWEGIAN_LAST_NAMES)
            initials = f"{first_name[0]}{last_name[0]}"
            employees.append({
                "id": str(uuid.uuid4()),
                "organization_id": org_id,
                "initialer": initials,
                "navn": f"{first_name} {last_name}",
                "epost": f"{first_name.lower()}.{last_name.lower()}@{org_name.lower()}.no",
                "telefon": f"+47 {random.randint(400, 499)} {random.randint(10, 99)} {random.randint(100, 999)}",
                "stilling": random.choice(["Servicetekniker", "Montør", "Prosjektleder", "Lærling"]),
                "intern_sats": random.randint(500, 800),
                "faktura_sats": random.randint(800, 1200),
                "pa_service_sats": random.randint(600, 900),
                "pa_montering_sats": random.randint(650, 950),
                "pa_timesats": random.randint(700, 1000),
                "pa_kjoresats": random.randint(400, 600),
                "pa_km_sats": random.uniform(5, 10),
                "created_at": datetime.now().isoformat()
            })
        await db.employees.insert_many(employees)
        print(f"  ✅ Created {len(employees)} employees")
        
        print(f"  🏢 Creating customers for {org_name}...")
        customers = []
        for i in range(num_customers):
            city, postnr = random.choice(NORWEGIAN_CITIES)
            street = random.choice(NORWEGIAN_STREETS)
            company_type = random.choice(COMPANY_TYPES)
            anleggsnr = f"{random.randint(1000, 9999)}"
            kundennr = f"K{random.randint(100, 999)}"
            
            customers.append({
                "id": str(uuid.uuid4()),
                "organization_id": org_id,
                "anleggsnr": anleggsnr,
                "kundennr": kundennr,
                "kundnavn": f"{city} {company_type}",
                "typenr": random.choice(["T001", "T002", "T003"]),
                "typenavn": random.choice(["Type A", "Type B", "Type C"]),
                "kommune": city,
                "adresse": f"{street}vei {random.randint(1, 150)}",
                "postnr": postnr,
                "poststed": city,
                "service_intervall": random.choice(["Årlig", "Halvårlig", "Kvartalsvis"]),
                "uke": str(random.randint(1, 52)),
                "serviceansvarlig": random.choice([emp['navn'] for emp in employees]),
                "telefon1": f"+47 {random.randint(20, 99)} {random.randint(10, 99)} {random.randint(10, 99)} {random.randint(10, 99)}",
                "epost": f"post@{city.lower()}{company_type.lower()}.no",
                "created_at": datetime.now().isoformat()
            })
        await db.customers.insert_many(customers)
        print(f"  ✅ Created {len(customers)} customers")
        
        print(f"  📦 Creating products for {org_name}...")
        products = []
        for i in range(random.randint(10, 20)):
            category = random.choice(PRODUCT_CATEGORIES)
            products.append({
                "id": str(uuid.uuid4()),
                "organization_id": org_id,
                "produktnr": f"P{random.randint(1000, 9999)}",
                "navn": f"{category} produkt {i+1}",
                "beskrivelse": f"Beskrivelse for {category} produkt",
                "kategori": category,
                "kundepris": random.randint(500, 5000),
                "pa_lager": random.randint(0, 100),
                "created_at": datetime.now().isoformat()
            })
        await db.products.insert_many(products)
        print(f"  ✅ Created {len(products)} products")
        
        print(f"  📋 Creating services for {org_name}...")
        services = [
            {
                "id": str(uuid.uuid4()),
                "organization_id": org_id,
                "tjenestenr": "T001",
                "tjeneste_navn": "Standard Service",
                "beskrivelse": "Standard serviceoppfølging",
                "leverandor": org_name,
                "pris": 1200.0,
                "t1_ekstraservice": 950.0,
                "t2_ekstraservice_50": 1425.0,
                "t3_ekstraservice_100": 1900.0,
                "t4_ekstraarbeid": 1000.0,
                "t5_kjoretid": 800.0,
                "t6_km_godtgjorelse": 6.5,
                "created_at": datetime.now().isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "organization_id": org_id,
                "tjenestenr": "T002",
                "tjeneste_navn": "Premium Service",
                "beskrivelse": "Premium serviceoppfølging",
                "leverandor": org_name,
                "pris": 1800.0,
                "t1_ekstraservice": 1200.0,
                "t2_ekstraservice_50": 1800.0,
                "t3_ekstraservice_100": 2400.0,
                "t4_ekstraarbeid": 1300.0,
                "t5_kjoretid": 1000.0,
                "t6_km_godtgjorelse": 8.0,
                "created_at": datetime.now().isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "organization_id": org_id,
                "tjenestenr": "T003",
                "tjeneste_navn": "Basic Service",
                "beskrivelse": "Grunnleggende service",
                "leverandor": org_name,
                "pris": 800.0,
                "t1_ekstraservice": 700.0,
                "t2_ekstraservice_50": 1050.0,
                "t3_ekstraservice_100": 1400.0,
                "t4_ekstraarbeid": 750.0,
                "t5_kjoretid": 600.0,
                "t6_km_godtgjorelse": 5.0,
                "created_at": datetime.now().isoformat()
            }
        ]
        await db.services.insert_many(services)
        print(f"  ✅ Created {len(services)} services")
    
    # Seed data for both organizations
    await seed_organization_data(vmp_org_id, "VMP", num_customers=15)
    await seed_organization_data(biovac_org_id, "Biovac", num_customers=20)
    
    print("\n✨ Database seeding completed successfully!")
    print("\n📝 Test Login Credentials:")
    print("=" * 50)
    print("VMP Organization:")
    print("  Admin: admin@vmp.no / admin123")
    print("  Users: user1@vmp.no, user2@vmp.no / user123")
    print("\nBiovac Organization:")
    print("  Admin: admin@biovac.no / admin123")
    print("  Users: user1-5@biovac.no / user123")
    print("=" * 50)
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_database())
