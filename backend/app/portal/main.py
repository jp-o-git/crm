import os

from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from .auth import router as auth_router
from .contacts import router as contact_router
from .offers import router as offer_router
from .reports import router as report_router

app = FastAPI(title="Haven House API")
FRONTEND_URI = os.getenv("FRONTEND_REDIRECT_URI", "http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URI, "http://127.0.0.1:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(contact_router)
app.include_router(offer_router)
app.include_router(report_router)

