from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import equipment, facilities, rooms

app = FastAPI(
    title="IronPlan Mini",
    description="Facility equipment tracker API for correctional facilities.",
    version="1.0.0",
)

# Allow the Vercel frontend and local dev to reach the API.
# In production, tighten ALLOW_ORIGINS to your exact Vercel domain.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# All routes are prefixed with /api so Vercel can route /api/* to the
# Python serverless function while serving the frontend at /.
app.include_router(equipment.router,  prefix="/api")
app.include_router(facilities.router, prefix="/api")
app.include_router(rooms.router,      prefix="/api")


@app.get("/api/health", tags=["meta"])
def health():
    return {"status": "ok"}
