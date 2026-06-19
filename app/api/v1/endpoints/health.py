from fastapi import APIRouter

router = APIRouter()

@router.get("/health", tags=["healthcheck"])
async def health_check():
    """
    Simple healthcheck endpoint to verify the API is running.
    """
    return {"status": "ok"}
