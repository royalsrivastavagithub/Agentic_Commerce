import uvicorn
from fastapi import FastAPI
from app.api.v1.router import api_router

app = FastAPI(
    title="Agentic Commerce API",
    description="Backend API for Agentic Commerce.",
    version="0.1.0"
)

# Include the API router
app.include_router(api_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"message": "Welcome to Agentic Commerce API. Healthcheck is available at /api/v1/health"}

def main():
    uvicorn.run("app.main:app", port=8000, reload=True)

if __name__ == "__main__":
    main()
