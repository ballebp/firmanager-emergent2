"""
Import customers from Excel file
"""
import asyncio
import pandas as pd
import requests
from io import BytesIO
from motor.motor_asyncio import AsyncIOMotorClient
import uuid
from datetime import datetime

# Database connection
MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "test_database"

# Excel file URL
EXCEL_URL = "https://customer-assets.emergentagent.com/job_servicemanager-3/artifacts/usf8pwlr_kunde_db%20%281%29.xlsx"

async def import_customers():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("📥 Downloading Excel file...")
    response = requests.get(EXCEL_URL)
    df = pd.read_excel(BytesIO(response.content))
    
    print(f"📊 Found {len(df)} customers in Excel file")
    
    # Clear existing customers
    print("🗑️  Removing existing customers...")
    await db.customers.delete_many({})
    
    print("📝 Importing customers...")
    customers = []
    
    for _, row in df.iterrows():
        # Helper function to safely convert values
        def safe_str(val):
            if pd.isna(val):
                return None
            return str(val).strip() if val else None
        
        def safe_int_str(val):
            if pd.isna(val):
                return None
            try:
                return str(int(val))
            except:
                return str(val).strip() if val else None
        
        # Map Excel columns to our model
        customer = {
            "id": str(uuid.uuid4()),
            "anleggsnr": safe_int_str(row.get('An.nr.')) or "",
            "kundennr": safe_int_str(row.get('Knr')) or "",
            "kundnavn": safe_str(row.get('Kunde')) or "",
            "typenr": safe_int_str(row.get('Type nr.')),
            "typenavn": safe_str(row.get('Type navn')),
            "kommune": safe_str(row.get('Kommune')) or "",
            "adresse": safe_str(row.get('Adresse')) or "",
            "postnr": safe_int_str(row.get('Postnr')) or "",
            "poststed": safe_str(row.get('Sted')) or "",
            "service_intervall": safe_int_str(row.get('Service intervall')),
            "uke": safe_int_str(row.get('Uke')),
            "serviceansvarlig": safe_str(row.get('Serviceansvarlig')),
            "telefon1": safe_str(row.get('Tlf 1')),
            "telefon2": safe_str(row.get('Tlf 2')),
            "epost": safe_str(row.get('Epost')),
            "startdato": safe_str(row.get('Startdato')),
            "styreenhet": safe_str(row.get('Styreenhet')),
            "kommentar": safe_str(row.get('Kommentar')),
            "kundeinfo": safe_str(row.get('Kundeinfo')),
            "tjeneste_nr": None,  # Will be linked later if needed
            "created_at": datetime.now().isoformat()
        }
        
        customers.append(customer)
    
    # Insert all customers
    if customers:
        await db.customers.insert_many(customers)
    
    client.close()
    
    print(f"\n✅ Successfully imported {len(customers)} customers!")
    print("\n📊 Sample imported customers:")
    for c in customers[:5]:
        print(f"  - {c['anleggsnr']}: {c['kundnavn']} ({c['poststed']})")
        if c['kommentar']:
            print(f"    Kommentar: {c['kommentar'][:60]}...")

if __name__ == "__main__":
    asyncio.run(import_customers())
