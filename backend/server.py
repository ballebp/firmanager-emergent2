from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext
import pandas as pd
from io import BytesIO

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security setup
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# ==================== MODELS ====================

# User & Auth Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    role: str = "user"  # user, admin, manager
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "user"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

# Customer Models
class Customer(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    anleggsnr: str  # An.nr.
    kundennr: str  # Knr
    kundnavn: str  # Kunde
    typenr: Optional[str] = None  # Type nr.
    typenavn: Optional[str] = None  # Type navn
    kommune: str  # Kommune
    adresse: str  # Adresse
    postnr: str  # Postnr
    poststed: str  # Sted
    service_intervall: Optional[str] = None  # Service intervall
    uke: Optional[str] = None  # Uke
    serviceansvarlig: Optional[str] = None  # Serviceansvarlig
    telefon1: Optional[str] = None  # Tlf 1
    telefon2: Optional[str] = None  # Tlf 2
    epost: Optional[str] = None  # Epost
    startdato: Optional[str] = None  # Startdato
    styreenhet: Optional[str] = None  # Styreenhet
    kommentar: Optional[str] = None  # Kommentar
    kundeinfo: Optional[str] = None  # Kundeinfo
    tjeneste_nr: Optional[str] = None  # For service linking
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CustomerCreate(BaseModel):
    anleggsnr: str
    kundennr: str
    kundnavn: str
    typenr: Optional[str] = None
    typenavn: Optional[str] = None
    kommune: str
    adresse: str
    postnr: str
    poststed: str
    service_intervall: Optional[str] = None
    uke: Optional[str] = None
    serviceansvarlig: Optional[str] = None
    telefon1: Optional[str] = None
    telefon2: Optional[str] = None
    epost: Optional[str] = None
    startdato: Optional[str] = None
    styreenhet: Optional[str] = None
    kommentar: Optional[str] = None
    kundeinfo: Optional[str] = None
    tjeneste_nr: Optional[str] = None

# Employee Models
class Employee(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    initialer: str
    navn: str
    epost: Optional[str] = None
    telefon: Optional[str] = None
    stilling: str
    intern_sats: float = 0.0
    faktura_sats: float = 0.0
    pa_service_sats: float = 0.0
    pa_montering_sats: float = 0.0
    pa_timesats: float = 0.0
    pa_kjoresats: float = 0.0
    pa_km_sats: float = 0.0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EmployeeCreate(BaseModel):
    initialer: str
    navn: str
    epost: Optional[str] = None
    telefon: Optional[str] = None
    stilling: str
    intern_sats: float = 0.0
    faktura_sats: float = 0.0
    pa_service_sats: float = 0.0
    pa_montering_sats: float = 0.0
    pa_timesats: float = 0.0
    pa_kjoresats: float = 0.0
    pa_km_sats: float = 0.0

# Work Order Models
class WorkOrder(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_id: str
    employee_id: str
    date: datetime
    order_type: str  # service, extra, montering, etc.
    status: str = "planlagt"  # planlagt, fullført, avbrutt
    description: Optional[str] = None
    arbeidstid: float = 0.0  # hours
    kjoretid: float = 0.0  # hours
    kjorte_km: float = 0.0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class WorkOrderCreate(BaseModel):
    customer_id: str
    employee_id: str
    date: datetime
    order_type: str
    status: str = "planlagt"
    description: Optional[str] = None
    arbeidstid: float = 0.0
    kjoretid: float = 0.0
    kjorte_km: float = 0.0

# Internal Order Models
class InternalOrder(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    avdeling: str
    date: datetime
    employee_id: str
    beskrivelse: str
    arbeidstid: float = 0.0
    task_type: str = "kontor"  # kontor, ekstra, montering, soknad, vedlikehold, diverse
    kommentar: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class InternalOrderCreate(BaseModel):
    avdeling: str
    date: datetime
    employee_id: str
    beskrivelse: str
    arbeidstid: float = 0.0
    task_type: str = "kontor"
    kommentar: Optional[str] = None

# Product Models
class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    produktnr: str
    navn: str
    beskrivelse: Optional[str] = None
    kategori: Optional[str] = None
    kundepris: float = 0.0
    pa_lager: int = 0
    image_url: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductCreate(BaseModel):
    produktnr: str
    navn: str
    beskrivelse: Optional[str] = None
    kategori: Optional[str] = None
    kundepris: float = 0.0
    pa_lager: int = 0
    image_url: Optional[str] = None

# Route Models
class Route(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    date: datetime
    anleggsnr_list: List[str]
    optimized: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RouteCreate(BaseModel):
    date: datetime
    anleggsnr_list: List[str]

# HMS Models
class HMSRiskAssessment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tittel: str
    beskrivelse: str
    dato: datetime
    alvorlighetsgrad: str = "middels"  # lav, middels, høy
    status: str = "aktiv"  # aktiv, lukket
    ansvarlig: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class HMSRiskAssessmentCreate(BaseModel):
    tittel: str
    beskrivelse: str
    dato: datetime
    alvorlighetsgrad: str = "middels"
    status: str = "aktiv"
    ansvarlig: Optional[str] = None

class HMSIncident(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    dato: datetime
    beskrivelse: str
    type: str = "ulykke"  # ulykke, nestenulykke, observasjon
    status: str = "åpen"  # åpen, undersøkes, lukket
    alvorlighetsgrad: str = "lav"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class HMSIncidentCreate(BaseModel):
    dato: datetime
    beskrivelse: str
    type: str = "ulykke"
    status: str = "åpen"
    alvorlighetsgrad: str = "lav"

class HMSTraining(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    navn: str
    beskrivelse: str
    dato: datetime
    expires_at: Optional[datetime] = None
    status: str = "aktiv"  # aktiv, utløpt
    ansatte: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class HMSTrainingCreate(BaseModel):
    navn: str
    beskrivelse: str
    dato: datetime
    expires_at: Optional[datetime] = None
    status: str = "aktiv"
    ansatte: List[str] = []

class HMSEquipment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    navn: str
    control_date: datetime
    next_control: datetime
    status: str = "ok"  # ok, trenger_kontroll, utrangert
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class HMSEquipmentCreate(BaseModel):
    navn: str
    control_date: datetime
    next_control: datetime
    status: str = "ok"

# Economy Models
class Payout(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employee_id: str
    type: str  # lonn, bonus, pensjon, feriepenger
    amount: float
    date: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PayoutCreate(BaseModel):
    employee_id: str
    type: str
    amount: float
    date: datetime

class Service(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tjenestenr: str
    tjeneste_navn: str
    beskrivelse: Optional[str] = None
    leverandor: Optional[str] = None
    produsent_id: Optional[str] = None  # Kobling til Produsent for satser
    pris: float = 0.0  # Fast pris for tjenesten (ikke timepris)
    t1_ekstraservice: float = 0.0  # Pris pr time
    t2_ekstraservice_50: float = 0.0  # Pris pr time (50% tillegg)
    t3_ekstraservice_100: float = 0.0  # Pris pr time (100% tillegg)
    t4_ekstraarbeid: float = 0.0  # Pris pr time
    t5_kjoretid: float = 0.0  # Pris pr time
    t6_km_godtgjorelse: float = 0.0  # Pris pr km
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ServiceCreate(BaseModel):
    tjenestenr: str
    tjeneste_navn: str
    beskrivelse: Optional[str] = None
    leverandor: Optional[str] = None
    produsent_id: Optional[str] = None  # Kobling til Produsent for satser
    pris: float = 0.0
    t1_ekstraservice: float = 0.0
    t2_ekstraservice_50: float = 0.0
    t3_ekstraservice_100: float = 0.0
    t4_ekstraarbeid: float = 0.0
    t5_kjoretid: float = 0.0
    t6_km_godtgjorelse: float = 0.0

class SupplierPricing(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str  # Produsent navn
    arbeidstid_rate: float = 0.0
    kjoretid_rate: float = 0.0
    km_rate: float = 0.0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SupplierPricingCreate(BaseModel):
    name: str  # Produsent navn
    arbeidstid_rate: float = 0.0
    kjoretid_rate: float = 0.0
    km_rate: float = 0.0

# ==================== AUTHENTICATION ====================

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    return User(**user)

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/register", response_model=User)
async def register(user_input: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_input.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    hashed_password = get_password_hash(user_input.password)
    user = User(
        email=user_input.email,
        name=user_input.name,
        role=user_input.role
    )
    
    user_doc = user.model_dump()
    user_doc['password_hash'] = hashed_password
    user_doc['created_at'] = user_doc['created_at'].isoformat()
    
    await db.users.insert_one(user_doc)
    return user

@api_router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    user_doc = await db.users.find_one({"email": credentials.email})
    if not user_doc or not verify_password(credentials.password, user_doc['password_hash']):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    # Convert datetime
    if isinstance(user_doc['created_at'], str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    user = User(**user_doc)
    access_token = create_access_token(data={"sub": user.id})
    
    return Token(access_token=access_token, token_type="bearer", user=user)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# ==================== CUSTOMER ENDPOINTS ====================

@api_router.post("/customers", response_model=Customer)
async def create_customer(customer_input: CustomerCreate, current_user: User = Depends(get_current_user)):
    customer = Customer(**customer_input.model_dump())
    doc = customer.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.customers.insert_one(doc)
    return customer

@api_router.get("/customers", response_model=List[Customer])
async def get_customers(
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    query = {}
    if search:
        query = {
            "$or": [
                {"kundnavn": {"$regex": search, "$options": "i"}},
                {"anleggsnr": {"$regex": search, "$options": "i"}},
                {"kundennr": {"$regex": search, "$options": "i"}},
                {"poststed": {"$regex": search, "$options": "i"}},
                {"postnr": {"$regex": search, "$options": "i"}},
                {"kommune": {"$regex": search, "$options": "i"}},
                {"adresse": {"$regex": search, "$options": "i"}},
                {"typenavn": {"$regex": search, "$options": "i"}}
            ]
        }
    
    customers = await db.customers.find(query, {"_id": 0}).to_list(2000)
    for customer in customers:
        if isinstance(customer.get('created_at'), str):
            customer['created_at'] = datetime.fromisoformat(customer['created_at'])
    return customers

@api_router.get("/customers/{customer_id}", response_model=Customer)
async def get_customer(customer_id: str, current_user: User = Depends(get_current_user)):
    customer = await db.customers.find_one({"id": customer_id}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    if isinstance(customer['created_at'], str):
        customer['created_at'] = datetime.fromisoformat(customer['created_at'])
    return Customer(**customer)

@api_router.put("/customers/{customer_id}", response_model=Customer)
async def update_customer(
    customer_id: str,
    customer_input: CustomerCreate,
    current_user: User = Depends(get_current_user)
):
    existing = await db.customers.find_one({"id": customer_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    updated_customer = Customer(
        id=customer_id,
        created_at=datetime.fromisoformat(existing['created_at']) if isinstance(existing['created_at'], str) else existing['created_at'],
        **customer_input.model_dump()
    )
    doc = updated_customer.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.customers.replace_one({"id": customer_id}, doc)
    return updated_customer

@api_router.delete("/customers/{customer_id}")
async def delete_customer(customer_id: str, current_user: User = Depends(get_current_user)):
    result = await db.customers.delete_one({"id": customer_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"message": "Customer deleted successfully"}

@api_router.post("/customers/import")
async def import_customers(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Import customers from Excel file"""
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload .xlsx or .xls file")
    
    try:
        contents = await file.read()
        df = pd.read_excel(BytesIO(contents))
        
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
        
        # Delete existing customers
        await db.customers.delete_many({})
        
        customers = []
        for _, row in df.iterrows():
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
                "tjeneste_nr": None,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            customers.append(customer)
        
        if customers:
            await db.customers.insert_many(customers)
        
        return {"message": "Import successful", "imported_count": len(customers)}
    
    except Exception as e:
        logging.error(f"Import error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")

# ==================== EMPLOYEE ENDPOINTS ====================

@api_router.post("/employees", response_model=Employee)
async def create_employee(employee_input: EmployeeCreate, current_user: User = Depends(get_current_user)):
    employee = Employee(**employee_input.model_dump())
    doc = employee.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.employees.insert_one(doc)
    return employee

@api_router.get("/employees", response_model=List[Employee])
async def get_employees(current_user: User = Depends(get_current_user)):
    employees = await db.employees.find({}, {"_id": 0}).to_list(1000)
    for employee in employees:
        if isinstance(employee['created_at'], str):
            employee['created_at'] = datetime.fromisoformat(employee['created_at'])
    return employees

@api_router.get("/employees/{employee_id}", response_model=Employee)
async def get_employee(employee_id: str, current_user: User = Depends(get_current_user)):
    employee = await db.employees.find_one({"id": employee_id}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    if isinstance(employee['created_at'], str):
        employee['created_at'] = datetime.fromisoformat(employee['created_at'])
    return Employee(**employee)

@api_router.put("/employees/{employee_id}", response_model=Employee)
async def update_employee(
    employee_id: str,
    employee_input: EmployeeCreate,
    current_user: User = Depends(get_current_user)
):
    existing = await db.employees.find_one({"id": employee_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    updated_employee = Employee(
        id=employee_id,
        created_at=datetime.fromisoformat(existing['created_at']) if isinstance(existing['created_at'], str) else existing['created_at'],
        **employee_input.model_dump()
    )
    doc = updated_employee.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.employees.replace_one({"id": employee_id}, doc)
    return updated_employee

@api_router.delete("/employees/{employee_id}")
async def delete_employee(employee_id: str, current_user: User = Depends(get_current_user)):
    result = await db.employees.delete_one({"id": employee_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Employee not found")
    return {"message": "Employee deleted successfully"}

# ==================== WORK ORDER ENDPOINTS ====================

@api_router.post("/workorders", response_model=WorkOrder)
async def create_workorder(workorder_input: WorkOrderCreate, current_user: User = Depends(get_current_user)):
    workorder = WorkOrder(**workorder_input.model_dump())
    doc = workorder.model_dump()
    doc['date'] = doc['date'].isoformat()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.workorders.insert_one(doc)
    return workorder

@api_router.get("/workorders", response_model=List[WorkOrder])
async def get_workorders(
    status: Optional[str] = None,
    order_type: Optional[str] = None,
    employee_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    query = {}
    if status:
        query['status'] = status
    if order_type:
        query['order_type'] = order_type
    if employee_id:
        query['employee_id'] = employee_id
    
    workorders = await db.workorders.find(query, {"_id": 0}).to_list(1000)
    for wo in workorders:
        if isinstance(wo['date'], str):
            wo['date'] = datetime.fromisoformat(wo['date'])
        if isinstance(wo['created_at'], str):
            wo['created_at'] = datetime.fromisoformat(wo['created_at'])
    return workorders

@api_router.get("/workorders/{workorder_id}", response_model=WorkOrder)
async def get_workorder(workorder_id: str, current_user: User = Depends(get_current_user)):
    workorder = await db.workorders.find_one({"id": workorder_id}, {"_id": 0})
    if not workorder:
        raise HTTPException(status_code=404, detail="Work order not found")
    if isinstance(workorder['date'], str):
        workorder['date'] = datetime.fromisoformat(workorder['date'])
    if isinstance(workorder['created_at'], str):
        workorder['created_at'] = datetime.fromisoformat(workorder['created_at'])
    return WorkOrder(**workorder)

@api_router.put("/workorders/{workorder_id}", response_model=WorkOrder)
async def update_workorder(
    workorder_id: str,
    workorder_input: WorkOrderCreate,
    current_user: User = Depends(get_current_user)
):
    existing = await db.workorders.find_one({"id": workorder_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Work order not found")
    
    updated_wo = WorkOrder(
        id=workorder_id,
        created_at=datetime.fromisoformat(existing['created_at']) if isinstance(existing['created_at'], str) else existing['created_at'],
        **workorder_input.model_dump()
    )
    doc = updated_wo.model_dump()
    doc['date'] = doc['date'].isoformat()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.workorders.replace_one({"id": workorder_id}, doc)
    return updated_wo

@api_router.delete("/workorders/{workorder_id}")
async def delete_workorder(workorder_id: str, current_user: User = Depends(get_current_user)):
    result = await db.workorders.delete_one({"id": workorder_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Work order not found")
    return {"message": "Work order deleted successfully"}

# ==================== INTERNAL ORDER ENDPOINTS ====================

@api_router.post("/internalorders", response_model=InternalOrder)
async def create_internalorder(order_input: InternalOrderCreate, current_user: User = Depends(get_current_user)):
    order = InternalOrder(**order_input.model_dump())
    doc = order.model_dump()
    doc['date'] = doc['date'].isoformat()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.internalorders.insert_one(doc)
    return order

@api_router.get("/internalorders", response_model=List[InternalOrder])
async def get_internalorders(current_user: User = Depends(get_current_user)):
    orders = await db.internalorders.find({}, {"_id": 0}).to_list(1000)
    for order in orders:
        if isinstance(order['date'], str):
            order['date'] = datetime.fromisoformat(order['date'])
        if isinstance(order['created_at'], str):
            order['created_at'] = datetime.fromisoformat(order['created_at'])
    return orders

@api_router.delete("/internalorders/{order_id}")
async def delete_internalorder(order_id: str, current_user: User = Depends(get_current_user)):
    result = await db.internalorders.delete_one({"id": order_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Internal order not found")
    return {"message": "Internal order deleted successfully"}

@api_router.put("/internalorders/{order_id}", response_model=InternalOrder)
async def update_internalorder(order_id: str, order_input: InternalOrderCreate, current_user: User = Depends(get_current_user)):
    existing = await db.internalorders.find_one({"id": order_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Internal order not found")
    
    update_data = order_input.model_dump()
    update_data['id'] = order_id
    update_data['created_at'] = existing.get('created_at', datetime.now(timezone.utc).isoformat())
    
    await db.internalorders.replace_one({"id": order_id}, update_data)
    
    if isinstance(update_data['created_at'], str):
        update_data['created_at'] = datetime.fromisoformat(update_data['created_at'])
    
    return InternalOrder(**update_data)

# ==================== PRODUCT ENDPOINTS ====================

@api_router.post("/products", response_model=Product)
async def create_product(product_input: ProductCreate, current_user: User = Depends(get_current_user)):
    product = Product(**product_input.model_dump())
    doc = product.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.products.insert_one(doc)
    return product

@api_router.get("/products", response_model=List[Product])
async def get_products(current_user: User = Depends(get_current_user)):
    products = await db.products.find({}, {"_id": 0}).to_list(1000)
    for product in products:
        if isinstance(product['created_at'], str):
            product['created_at'] = datetime.fromisoformat(product['created_at'])
    return products

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(
    product_id: str,
    product_input: ProductCreate,
    current_user: User = Depends(get_current_user)
):
    existing = await db.products.find_one({"id": product_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    
    updated_product = Product(
        id=product_id,
        created_at=datetime.fromisoformat(existing['created_at']) if isinstance(existing['created_at'], str) else existing['created_at'],
        **product_input.model_dump()
    )
    doc = updated_product.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.products.replace_one({"id": product_id}, doc)
    return updated_product

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, current_user: User = Depends(get_current_user)):
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted successfully"}

@api_router.post("/products/{product_id}/upload-image")
async def upload_product_image(
    product_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload image for a product"""
    existing = await db.products.find_one({"id": product_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Validate file type
    allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type. Allowed: jpeg, png, gif, webp")
    
    # Save file to uploads directory
    import os
    uploads_dir = Path(__file__).parent / "uploads" / "products"
    uploads_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate unique filename
    ext = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
    filename = f"{product_id}.{ext}"
    filepath = uploads_dir / filename
    
    contents = await file.read()
    with open(filepath, 'wb') as f:
        f.write(contents)
    
    # Update product with image URL
    image_url = f"/api/uploads/products/{filename}"
    await db.products.update_one(
        {"id": product_id},
        {"$set": {"image_url": image_url}}
    )
    
    return {"message": "Image uploaded successfully", "image_url": image_url}

# Serve uploaded files
from fastapi.responses import FileResponse

@api_router.get("/uploads/products/{filename}")
async def get_product_image(filename: str):
    filepath = Path(__file__).parent / "uploads" / "products" / filename
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(filepath)

# ==================== ROUTE ENDPOINTS ====================

@api_router.post("/routes", response_model=Route)
async def create_route(route_input: RouteCreate, current_user: User = Depends(get_current_user)):
    # Get customers to optimize by postal code
    customers = await db.customers.find(
        {"anleggsnr": {"$in": route_input.anleggsnr_list}},
        {"_id": 0, "anleggsnr": 1, "postnr": 1, "adresse": 1}
    ).to_list(1000)
    
    # Sort by postal code then by address for geo-optimization
    customers_sorted = sorted(customers, key=lambda x: (x.get('postnr', '9999'), x.get('adresse', '')))
    optimized_list = [c['anleggsnr'] for c in customers_sorted]
    
    route = Route(
        date=route_input.date,
        anleggsnr_list=optimized_list,
        optimized=True
    )
    doc = route.model_dump()
    doc['date'] = doc['date'].isoformat()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.routes.insert_one(doc)
    return route

@api_router.post("/routes/from-anleggsnr", response_model=Route)
async def create_route_from_anleggsnr(
    route_input: RouteCreate,
    current_user: User = Depends(get_current_user)
):
    """Create route from pasted anleggsnr list - same as regular route but named for clarity"""
    return await create_route(route_input, current_user)

@api_router.get("/routes", response_model=List[Route])
async def get_routes(current_user: User = Depends(get_current_user)):
    routes = await db.routes.find({}, {"_id": 0}).to_list(1000)
    for route in routes:
        if isinstance(route['date'], str):
            route['date'] = datetime.fromisoformat(route['date'])
        if isinstance(route['created_at'], str):
            route['created_at'] = datetime.fromisoformat(route['created_at'])
    return routes

# ==================== HMS ENDPOINTS ====================

@api_router.post("/hms/riskassessments", response_model=HMSRiskAssessment)
async def create_risk_assessment(input: HMSRiskAssessmentCreate, current_user: User = Depends(get_current_user)):
    assessment = HMSRiskAssessment(**input.model_dump())
    doc = assessment.model_dump()
    doc['dato'] = doc['dato'].isoformat()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.hms_risk_assessments.insert_one(doc)
    return assessment

@api_router.get("/hms/riskassessments", response_model=List[HMSRiskAssessment])
async def get_risk_assessments(current_user: User = Depends(get_current_user)):
    assessments = await db.hms_risk_assessments.find({}, {"_id": 0}).to_list(1000)
    for a in assessments:
        if isinstance(a['dato'], str):
            a['dato'] = datetime.fromisoformat(a['dato'])
        if isinstance(a['created_at'], str):
            a['created_at'] = datetime.fromisoformat(a['created_at'])
    return assessments

@api_router.post("/hms/incidents", response_model=HMSIncident)
async def create_incident(input: HMSIncidentCreate, current_user: User = Depends(get_current_user)):
    incident = HMSIncident(**input.model_dump())
    doc = incident.model_dump()
    doc['dato'] = doc['dato'].isoformat()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.hms_incidents.insert_one(doc)
    return incident

@api_router.get("/hms/incidents", response_model=List[HMSIncident])
async def get_incidents(current_user: User = Depends(get_current_user)):
    incidents = await db.hms_incidents.find({}, {"_id": 0}).to_list(1000)
    for i in incidents:
        if isinstance(i['dato'], str):
            i['dato'] = datetime.fromisoformat(i['dato'])
        if isinstance(i['created_at'], str):
            i['created_at'] = datetime.fromisoformat(i['created_at'])
    return incidents

@api_router.post("/hms/training", response_model=HMSTraining)
async def create_training(input: HMSTrainingCreate, current_user: User = Depends(get_current_user)):
    training = HMSTraining(**input.model_dump())
    doc = training.model_dump()
    doc['dato'] = doc['dato'].isoformat()
    if doc['expires_at']:
        doc['expires_at'] = doc['expires_at'].isoformat()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.hms_training.insert_one(doc)
    return training

@api_router.get("/hms/training", response_model=List[HMSTraining])
async def get_training(current_user: User = Depends(get_current_user)):
    training = await db.hms_training.find({}, {"_id": 0}).to_list(1000)
    for t in training:
        if isinstance(t['dato'], str):
            t['dato'] = datetime.fromisoformat(t['dato'])
        if t['expires_at'] and isinstance(t['expires_at'], str):
            t['expires_at'] = datetime.fromisoformat(t['expires_at'])
        if isinstance(t['created_at'], str):
            t['created_at'] = datetime.fromisoformat(t['created_at'])
    return training

@api_router.post("/hms/equipment", response_model=HMSEquipment)
async def create_equipment(input: HMSEquipmentCreate, current_user: User = Depends(get_current_user)):
    equipment = HMSEquipment(**input.model_dump())
    doc = equipment.model_dump()
    doc['control_date'] = doc['control_date'].isoformat()
    doc['next_control'] = doc['next_control'].isoformat()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.hms_equipment.insert_one(doc)
    return equipment

@api_router.get("/hms/equipment", response_model=List[HMSEquipment])
async def get_equipment(current_user: User = Depends(get_current_user)):
    equipment = await db.hms_equipment.find({}, {"_id": 0}).to_list(1000)
    for e in equipment:
        if isinstance(e['control_date'], str):
            e['control_date'] = datetime.fromisoformat(e['control_date'])
        if isinstance(e['next_control'], str):
            e['next_control'] = datetime.fromisoformat(e['next_control'])
        if isinstance(e['created_at'], str):
            e['created_at'] = datetime.fromisoformat(e['created_at'])
    return equipment

# ==================== ECONOMY ENDPOINTS ====================

@api_router.post("/economy/payouts", response_model=Payout)
async def create_payout(input: PayoutCreate, current_user: User = Depends(get_current_user)):
    payout = Payout(**input.model_dump())
    doc = payout.model_dump()
    doc['date'] = doc['date'].isoformat()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.payouts.insert_one(doc)
    return payout

@api_router.get("/economy/payouts", response_model=List[Payout])
async def get_payouts(current_user: User = Depends(get_current_user)):
    payouts = await db.payouts.find({}, {"_id": 0}).to_list(1000)
    for p in payouts:
        if isinstance(p['date'], str):
            p['date'] = datetime.fromisoformat(p['date'])
        if isinstance(p['created_at'], str):
            p['created_at'] = datetime.fromisoformat(p['created_at'])
    return payouts

@api_router.post("/economy/services", response_model=Service)
async def create_service(input: ServiceCreate, current_user: User = Depends(get_current_user)):
    service = Service(**input.model_dump())
    doc = service.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.services.insert_one(doc)
    return service

@api_router.get("/economy/services", response_model=List[Service])
async def get_services(current_user: User = Depends(get_current_user)):
    services = await db.services.find({}, {"_id": 0}).to_list(1000)
    for s in services:
        if isinstance(s['created_at'], str):
            s['created_at'] = datetime.fromisoformat(s['created_at'])
    return services

@api_router.get("/economy/services/{service_id}", response_model=Service)
async def get_service(service_id: str, current_user: User = Depends(get_current_user)):
    service = await db.services.find_one({"id": service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    if isinstance(service['created_at'], str):
        service['created_at'] = datetime.fromisoformat(service['created_at'])
    return Service(**service)

@api_router.put("/economy/services/{service_id}", response_model=Service)
async def update_service(
    service_id: str,
    service_input: ServiceCreate,
    current_user: User = Depends(get_current_user)
):
    existing = await db.services.find_one({"id": service_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Service not found")
    
    updated_service = Service(
        id=service_id,
        created_at=datetime.fromisoformat(existing['created_at']) if isinstance(existing['created_at'], str) else existing['created_at'],
        **service_input.model_dump()
    )
    doc = updated_service.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.services.replace_one({"id": service_id}, doc)
    return updated_service

@api_router.delete("/economy/services/{service_id}")
async def delete_service(service_id: str, current_user: User = Depends(get_current_user)):
    result = await db.services.delete_one({"id": service_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    return {"message": "Service deleted successfully"}

@api_router.post("/economy/services/import")
async def import_services(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Import services from Excel file"""
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload .xlsx or .xls file")
    
    try:
        contents = await file.read()
        df = pd.read_excel(BytesIO(contents))
        
        def safe_str(val):
            if pd.isna(val):
                return None
            return str(val).strip() if val else None
        
        def safe_float(val):
            if pd.isna(val):
                return 0.0
            try:
                return float(val)
            except:
                return 0.0
        
        # Delete existing services
        await db.services.delete_many({})
        
        services = []
        for _, row in df.iterrows():
            service = {
                "id": str(uuid.uuid4()),
                "tjenestenr": safe_str(row.get('tjenestenr')) or "",
                "tjeneste_navn": safe_str(row.get('tjeneste navn')) or "",
                "beskrivelse": "",
                "leverandor": "",
                "pris": safe_float(row.get('Leverandør pris')),
                "t1_ekstraservice": 0.0,
                "t2_ekstraservice_50": 0.0,
                "t3_ekstraservice_100": 0.0,
                "t4_ekstraarbeid": 0.0,
                "t5_kjoretid": 0.0,
                "t6_km_godtgjorelse": 0.0,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            services.append(service)
        
        if services:
            await db.services.insert_many(services)
        
        return {"message": "Import successful", "imported_count": len(services)}
    
    except Exception as e:
        logging.error(f"Service import error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")

# Get service pricing by anleggsnr
@api_router.get("/customers/{anleggsnr}/service-pricing")
async def get_service_pricing_for_customer(anleggsnr: str, current_user: User = Depends(get_current_user)):
    # Find customer by anleggsnr
    customer = await db.customers.find_one({"anleggsnr": anleggsnr}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Get service based on customer's typenr (primary) or tjeneste_nr (fallback)
    service_nr = customer.get('typenr') or customer.get('tjeneste_nr')
    if not service_nr:
        return {"customer": customer, "service": None, "message": "No service type (typenr) assigned to customer"}
    
    service = await db.services.find_one({"tjenestenr": service_nr}, {"_id": 0})
    if not service:
        return {"customer": customer, "service": None, "message": f"Service with tjenestenr {service_nr} not found"}
    
    if isinstance(service.get('created_at'), str):
        service['created_at'] = datetime.fromisoformat(service['created_at'])
    
    return {
        "customer": customer,
        "service": service,
        "typenr": service_nr,
        "message": "Service pricing found"
    }

@api_router.post("/economy/supplier-pricing", response_model=SupplierPricing)
async def create_supplier_pricing(input: SupplierPricingCreate, current_user: User = Depends(get_current_user)):
    pricing = SupplierPricing(**input.model_dump())
    doc = pricing.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.supplier_pricing.insert_one(doc)
    return pricing

@api_router.get("/economy/supplier-pricing", response_model=List[SupplierPricing])
async def get_supplier_pricing(current_user: User = Depends(get_current_user)):
    pricing = await db.supplier_pricing.find({}, {"_id": 0}).to_list(1000)
    for p in pricing:
        if isinstance(p['created_at'], str):
            p['created_at'] = datetime.fromisoformat(p['created_at'])
        if isinstance(p['updated_at'], str):
            p['updated_at'] = datetime.fromisoformat(p['updated_at'])
        # Handle legacy data without name field
        if 'name' not in p:
            p['name'] = 'Standard'
    return pricing

@api_router.put("/economy/supplier-pricing/{pricing_id}", response_model=SupplierPricing)
async def update_supplier_pricing(
    pricing_id: str,
    pricing_input: SupplierPricingCreate,
    current_user: User = Depends(get_current_user)
):
    existing = await db.supplier_pricing.find_one({"id": pricing_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Supplier pricing not found")
    
    updated_pricing = SupplierPricing(
        id=pricing_id,
        created_at=datetime.fromisoformat(existing['created_at']) if isinstance(existing['created_at'], str) else existing['created_at'],
        updated_at=datetime.now(timezone.utc),
        **pricing_input.model_dump()
    )
    doc = updated_pricing.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    
    await db.supplier_pricing.replace_one({"id": pricing_id}, doc)
    return updated_pricing

@api_router.delete("/economy/supplier-pricing/{pricing_id}")
async def delete_supplier_pricing(pricing_id: str, current_user: User = Depends(get_current_user)):
    result = await db.supplier_pricing.delete_one({"id": pricing_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Supplier pricing not found")
    return {"message": "Supplier pricing deleted successfully"}

# ==================== DASHBOARD STATS ====================

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: User = Depends(get_current_user)):
    total_customers = await db.customers.count_documents({})
    total_workorders = await db.workorders.count_documents({})
    planned_workorders = await db.workorders.count_documents({"status": "planlagt"})
    total_products = await db.products.count_documents({})
    
    # Get work orders by type
    workorders = await db.workorders.find({}, {"_id": 0, "order_type": 1, "arbeidstid": 1, "kjoretid": 1, "kjorte_km": 1}).to_list(1000)
    
    stats_by_type = {}
    for wo in workorders:
        order_type = wo.get('order_type', 'service')
        if order_type not in stats_by_type:
            stats_by_type[order_type] = {"count": 0, "total_hours": 0, "total_km": 0}
        stats_by_type[order_type]["count"] += 1
        stats_by_type[order_type]["total_hours"] += wo.get('arbeidstid', 0) + wo.get('kjoretid', 0)
        stats_by_type[order_type]["total_km"] += wo.get('kjorte_km', 0)
    
    return {
        "total_customers": total_customers,
        "total_workorders": total_workorders,
        "planned_workorders": planned_workorders,
        "total_products": total_products,
        "stats_by_type": stats_by_type
    }

# ==================== APP SETUP ====================

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
