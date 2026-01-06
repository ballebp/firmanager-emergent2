"""
Seed script for ServiceManager application with Norwegian test data
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
MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "firmanager"

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
    collections = ['users', 'customers', 'employees', 'workorders', 'internalorders', 
                  'products', 'routes', 'hms_risk_assessments', 'hms_incidents', 
                  'hms_training', 'hms_equipment', 'payouts', 'services', 'supplier_pricing']
    
    for collection in collections:
        await db[collection].delete_many({})
    
    print("👤 Creating users...")
    admin_password = pwd_context.hash("admin123")
    user_password = pwd_context.hash("user123")
    
    test_password = pwd_context.hash("test")
    users = [
        {
            "id": str(uuid.uuid4()),
            "email": "admin@biovac.no",
            "name": "Admin Bruker",
            "role": "admin",
            "password_hash": admin_password,
            "created_at": datetime.now().isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "email": "bruker@biovac.no",
            "name": "Test Bruker",
            "role": "user",
            "password_hash": user_password,
            "created_at": datetime.now().isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "email": "test@test.com",
            "name": "Test User",
            "role": "admin",
            "password_hash": test_password,
            "created_at": datetime.now().isoformat()
        }
    ]
    await db.users.insert_many(users)
    print(f"✅ Created {len(users)} users")
    print("   📧 admin@biovac.no / admin123")
    print("   📧 bruker@biovac.no / user123")
    print("   📧 test@test.com / test")
    
    print("\n👷 Creating employees...")
    employees = []
    for i in range(8):
        first_name = random.choice(NORWEGIAN_FIRST_NAMES)
        last_name = random.choice(NORWEGIAN_LAST_NAMES)
        initials = f"{first_name[0]}{last_name[0]}"
        employees.append({
            "id": str(uuid.uuid4()),
            "initialer": initials,
            "navn": f"{first_name} {last_name}",
            "epost": f"{first_name.lower()}.{last_name.lower()}@biovac.no",
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
    print(f"✅ Created {len(employees)} employees")
    
    print("\n🏢 Creating customers...")
    customers = []
    for i in range(30):
        city, postnr = random.choice(NORWEGIAN_CITIES)
        street = random.choice(NORWEGIAN_STREETS)
        company_type = random.choice(COMPANY_TYPES)
        anleggsnr = f"{random.randint(1000, 9999)}"
        kundennr = f"K{random.randint(100, 999)}"
        
        customers.append({
            "id": str(uuid.uuid4()),
            "anleggsnr": anleggsnr,
            "kundennr": kundennr,
            "kundnavn": f"{city} {company_type}",
            "tjeneste_nr": random.choice(["T001", "T002", "T003"]),  # Link to service
            "anleggstype": company_type,
            "anleggsnavn": f"{street} {company_type}",
            "adresse": f"{street}vei {random.randint(1, 150)}",
            "postnr": postnr,
            "poststed": city,
            "kommune": city,
            "telefon1": f"+47 {random.randint(20, 99)} {random.randint(10, 99)} {random.randint(10, 99)} {random.randint(10, 99)}",
            "telefon2": f"+47 {random.randint(400, 499)} {random.randint(10, 99)} {random.randint(100, 999)}" if random.random() > 0.5 else None,
            "epost": f"post@{city.lower()}{company_type.lower()}.no",
            "rute": f"Rute {random.randint(1, 5)}",
            "uke": str(random.randint(1, 52)),
            "service_intervall": random.choice(["Årlig", "Halvårlig", "Kvartalsvis", "Månedlig"]),
            "created_at": datetime.now().isoformat()
        })
    await db.customers.insert_many(customers)
    print(f"✅ Created {len(customers)} customers")
    
    print("\n📋 Creating work orders...")
    workorders = []
    for i in range(50):
        customer = random.choice(customers)
        employee = random.choice(employees)
        order_date = datetime.now() - timedelta(days=random.randint(0, 90))
        
        workorders.append({
            "id": str(uuid.uuid4()),
            "customer_id": customer["id"],
            "employee_id": employee["id"],
            "date": order_date.isoformat(),
            "order_type": random.choice(["service", "ekstra", "montering"]),
            "status": random.choice(["fullført", "fullført", "fullført", "planlagt", "avbrutt"]),
            "description": f"Servicearbeid på {customer['anleggsnavn']}",
            "arbeidstid": round(random.uniform(1, 8), 1),
            "kjoretid": round(random.uniform(0.5, 3), 1),
            "kjorte_km": round(random.uniform(10, 200), 1),
            "created_at": datetime.now().isoformat()
        })
    await db.workorders.insert_many(workorders)
    print(f"✅ Created {len(workorders)} work orders")
    
    print("\n📝 Creating internal orders...")
    internalorders = []
    for i in range(20):
        employee = random.choice(employees)
        order_date = datetime.now() - timedelta(days=random.randint(0, 60))
        
        internalorders.append({
            "id": str(uuid.uuid4()),
            "avdeling": random.choice(["Administrasjon", "Service", "Montasje", "HMS"]),
            "date": order_date.isoformat(),
            "employee_id": employee["id"],
            "beskrivelse": random.choice([
                "Opplæring og kursing",
                "Møte med leverandør",
                "Administrasjonsarbeid",
                "Vedlikehold av utstyr",
                "Planlegging av prosjekter"
            ]),
            "arbeidstid": round(random.uniform(1, 8), 1),
            "task_type": random.choice(["kontor", "ekstra", "montering", "soknad", "vedlikehold", "diverse"]),
            "kommentar": "Internt arbeid",
            "created_at": datetime.now().isoformat()
        })
    await db.internalorders.insert_many(internalorders)
    print(f"✅ Created {len(internalorders)} internal orders")
    
    print("\n📦 Creating products...")
    products = []
    product_base_names = ["Filter", "Ventilator", "Varmeovn", "Kjøleenhet", "Branndør", "Avtrekksvifte", "Varmepumpe"]
    
    for i, name in enumerate(product_base_names):
        for variant in ["Standard", "Premium", "Pro"]:
            products.append({
                "id": str(uuid.uuid4()),
                "produktnr": f"P{1000 + len(products)}",
                "navn": f"{name} {variant}",
                "beskrivelse": f"Høykvalitets {name.lower()} for profesjonell bruk",
                "kategori": random.choice(PRODUCT_CATEGORIES),
                "kundepris": round(random.uniform(500, 15000), 2),
                "pa_lager": random.randint(0, 50),
                "created_at": datetime.now().isoformat()
            })
    await db.products.insert_many(products)
    print(f"✅ Created {len(products)} products")
    
    print("\n🗺️ Creating routes...")
    routes = []
    for i in range(5):
        route_customers = random.sample(customers, k=random.randint(3, 8))
        # Sort by postal code for optimization
        route_customers.sort(key=lambda x: x['postnr'])
        
        routes.append({
            "id": str(uuid.uuid4()),
            "date": (datetime.now() + timedelta(days=random.randint(1, 30))).isoformat(),
            "anleggsnr_list": [c["anleggsnr"] for c in route_customers],
            "optimized": True,
            "created_at": datetime.now().isoformat()
        })
    await db.routes.insert_many(routes)
    print(f"✅ Created {len(routes)} routes")
    
    print("\n🛡️ Creating HMS data...")
    # Risk Assessments
    risk_assessments = []
    risk_titles = [
        "Arbeid i høyden",
        "Kjemikaliehåndtering",
        "Elektrisk utstyr",
        "Brannfare ved sveising",
        "Fallulykker på tak"
    ]
    for title in risk_titles:
        risk_assessments.append({
            "id": str(uuid.uuid4()),
            "tittel": title,
            "beskrivelse": f"Risikovurdering for {title.lower()}",
            "dato": datetime.now().isoformat(),
            "alvorlighetsgrad": random.choice(["lav", "middels", "høy"]),
            "status": random.choice(["aktiv", "aktiv", "lukket"]),
            "ansvarlig": random.choice(employees)["navn"],
            "created_at": datetime.now().isoformat()
        })
    await db.hms_risk_assessments.insert_many(risk_assessments)
    
    # Incidents
    incidents = []
    incident_descriptions = [
        "Mindre kutt ved montering",
        "Nesten-ulykke med stige",
        "Farlig kjemikalie sølt",
        "Glemt sikkerhetsutstyr"
    ]
    for desc in incident_descriptions:
        incidents.append({
            "id": str(uuid.uuid4()),
            "dato": (datetime.now() - timedelta(days=random.randint(1, 90))).isoformat(),
            "beskrivelse": desc,
            "type": random.choice(["ulykke", "nestenulykke", "observasjon"]),
            "status": random.choice(["åpen", "undersøkes", "lukket"]),
            "alvorlighetsgrad": random.choice(["lav", "middels", "høy"]),
            "created_at": datetime.now().isoformat()
        })
    await db.hms_incidents.insert_many(incidents)
    
    # Training
    training = [
        {
            "id": str(uuid.uuid4()),
            "navn": "Arbeid i høyden",
            "beskrivelse": "Sertifisering for arbeid i høyden",
            "dato": (datetime.now() - timedelta(days=180)).isoformat(),
            "expires_at": (datetime.now() + timedelta(days=545)).isoformat(),
            "status": "aktiv",
            "ansatte": [e["id"] for e in random.sample(employees, k=5)],
            "created_at": datetime.now().isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "navn": "HMS-grunnkurs",
            "beskrivelse": "Grunnleggende HMS-opplæring",
            "dato": (datetime.now() - timedelta(days=90)).isoformat(),
            "expires_at": None,
            "status": "aktiv",
            "ansatte": [e["id"] for e in employees],
            "created_at": datetime.now().isoformat()
        }
    ]
    await db.hms_training.insert_many(training)
    
    # Equipment
    equipment = [
        {
            "id": str(uuid.uuid4()),
            "navn": "Stige 6m",
            "control_date": (datetime.now() - timedelta(days=30)).isoformat(),
            "next_control": (datetime.now() + timedelta(days=335)).isoformat(),
            "status": "ok",
            "created_at": datetime.now().isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "navn": "Fallsikringsutstyr",
            "control_date": (datetime.now() - timedelta(days=400)).isoformat(),
            "next_control": (datetime.now() - timedelta(days=35)).isoformat(),
            "status": "trenger_kontroll",
            "created_at": datetime.now().isoformat()
        }
    ]
    await db.hms_equipment.insert_many(equipment)
    
    print(f"✅ Created HMS data (risk assessments, incidents, training, equipment)")
    
    print("\n💰 Creating economy data...")
    # Services (with tjenestenr to link to customers)
    services = [
        {
            "id": str(uuid.uuid4()),
            "tjenestenr": "T001",
            "tjeneste_navn": "Serviceavtale Standard",
            "beskrivelse": "Årlig service og vedlikehold",
            "leverandor": "Biovac AS",
            "pris": 1490.0,  # Fast pris for service
            "t1_ekstraservice": 850.0,
            "t2_ekstraservice_50": 1275.0,
            "t3_ekstraservice_100": 1700.0,
            "t4_ekstraarbeid": 750.0,
            "t5_kjoretid": 500.0,
            "t6_km_godtgjorelse": 7.5,
            "created_at": datetime.now().isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "tjenestenr": "T002",
            "tjeneste_navn": "Serviceavtale Premium",
            "beskrivelse": "Halvårlig service og vedlikehold med prioritet",
            "leverandor": "Biovac AS",
            "pris": 2490.0,
            "t1_ekstraservice": 900.0,
            "t2_ekstraservice_50": 1350.0,
            "t3_ekstraservice_100": 1800.0,
            "t4_ekstraarbeid": 800.0,
            "t5_kjoretid": 550.0,
            "t6_km_godtgjorelse": 8.0,
            "created_at": datetime.now().isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "tjenestenr": "T003",
            "tjeneste_navn": "Akuttutrykning",
            "beskrivelse": "Akutt servicetjeneste med rask respons",
            "leverandor": "Biovac AS",
            "pris": 3500.0,
            "t1_ekstraservice": 1100.0,
            "t2_ekstraservice_50": 1650.0,
            "t3_ekstraservice_100": 2200.0,
            "t4_ekstraarbeid": 950.0,
            "t5_kjoretid": 650.0,
            "t6_km_godtgjorelse": 9.0,
            "created_at": datetime.now().isoformat()
        }
    ]
    await db.services.insert_many(services)
    
    # Supplier Pricing
    supplier_pricing = [{
        "id": str(uuid.uuid4()),
        "arbeidstid_rate": 850.0,
        "kjoretid_rate": 500.0,
        "km_rate": 7.5,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }]
    await db.supplier_pricing.insert_many(supplier_pricing)
    
    print(f"✅ Created economy data (services, supplier pricing)")
    
    client.close()
    print("\n🎉 Database seeded successfully!")
    print("\n📊 Summary:")
    print(f"   - {len(users)} users")
    print(f"   - {len(employees)} employees")
    print(f"   - {len(customers)} customers")
    print(f"   - {len(workorders)} work orders")
    print(f"   - {len(internalorders)} internal orders")
    print(f"   - {len(products)} products")
    print(f"   - {len(routes)} routes")
    print(f"   - HMS data created")
    print(f"   - Economy data created")

if __name__ == "__main__":
    asyncio.run(seed_database())
