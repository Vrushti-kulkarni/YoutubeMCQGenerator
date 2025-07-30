from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from youtube_processor import process_youtube_video, process_youtube_video_flashcards
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="YouTube Learning Generator API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class YouTubeRequest(BaseModel):
    url: str

class MCQResponse(BaseModel):
    mcq_data: str
    video_id: str
    status: str

class FlashcardResponse(BaseModel):
    flashcard_data: str
    video_id: str
    status: str

@app.get("/")
async def root():
    return {"message": "YouTube Learning Generator API is running"}

@app.post("/process-video", response_model=MCQResponse)
async def process_video(request: YouTubeRequest):
    """Process YouTube video and generate MCQ quiz"""
    try:
        logger.info(f"Processing video for MCQ: {request.url}")
        
        # Process the YouTube video and generate MCQs
        result = process_youtube_video(request.url)
        
        if result is None:
            raise HTTPException(
                status_code=400, 
                detail="Could not process the video. Please check if the video has transcripts available."
            )
        
        return MCQResponse(
            mcq_data=result["mcq_data"],
            video_id=result["video_id"],
            status="success"
        )
    
    except Exception as e:
        logger.error(f"Error processing video for MCQ: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/process-video-flashcards", response_model=FlashcardResponse)
async def process_video_flashcards(request: YouTubeRequest):
    """Process YouTube video and generate flashcards"""
    try:
        logger.info(f"Processing video for flashcards: {request.url}")
        
        # Process the YouTube video and generate flashcards
        result = process_youtube_video_flashcards(request.url)
        
        if result is None:
            raise HTTPException(
                status_code=400, 
                detail="Could not process the video. Please check if the video has transcripts available."
            )
        
        return FlashcardResponse(
            flashcard_data=result["flashcard_data"],
            video_id=result["video_id"],
            status="success"
        )
    
    except Exception as e:
        logger.error(f"Error processing video for flashcards: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)