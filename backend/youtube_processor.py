from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled
import pysbd
import re
import os
from crewai import Agent, Task, Crew, LLM, Process
import logging

logger = logging.getLogger(__name__)


def extract_youtube_video_id(url: str) -> str:
    """Extract video ID from YouTube URL"""
    found = re.search(r"(?:youtu\.be\/|watch\?v=)([\w-]+)", url)
    if found:
        return found.group(1)
    return None

def get_video_transcript(video_id: str) -> list | None:
    """Get transcript for a YouTube video"""
    try:
        ytt_api = YouTubeTranscriptApi()
        transcript = ytt_api.fetch(video_id)
        # YouTubeTranscriptApi returns objects with text attribute
        return [snippet.text for snippet in transcript]
    except TranscriptsDisabled:
        logger.warning(f"Transcripts disabled for video: {video_id}")
        return None
    except Exception as e:
        logger.error(f"Error fetching transcript: {str(e)}")
        logger.error(f"Error type: {type(e).__name__}")
        return None

def setup_gemini_llm():
    """Setup Gemini LLM with API key"""
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError("GOOGLE_API_KEY environment variable not set")
    
    # Try different models in order of preference
    models = [
        "gemini/gemini-1.5-flash",  # Then flash
    ]
    
    for model in models:
        try:
            llm = LLM(
                api_key=api_key,
                model=model,
                max_retries=3,  # Add retries
                timeout=60,  # Increase timeout
            )
            # Test the model with a simple prompt

            logger.info(f"Successfully connected to model: {model}")
            return llm
        except Exception as e:
            logger.warning(f"Failed to initialize {model}: {str(e)}")
            continue
    
    raise ValueError("All LLM models failed to initialize")

def create_agents(gemini_llm):
    """Create and return all required agents"""
    video_researcher = Agent(
        role="Video Researcher",
        goal="Extract relevant information from YouTube videos about the topic discussed",
        backstory="An expert researcher who specializes in analyzing video content and identifying key concepts and frameworks.",
        tools=[],
        verbose=True,
        llm=gemini_llm,
    )
    
    analyst = Agent(
        role='Learning Path Strategist',
        goal='Create comprehensive learning roadmaps with structured timeline and milestones',
        backstory="""You are an expert curriculum designer with 15+ years of experience in \
                    educational planning. You understand optimal learning sequences, pacing, \
                    and how to break down complex topics into manageable chunks.""",
        tools=[],
        verbose=True,
        llm=gemini_llm,
    )
    
    mcq_generator = Agent(
        role='Concept Reinforcement Specialist',
        goal='Generate high-quality MCQs to help students revise and test their understanding of learned concepts',
        backstory="""You are a seasoned educator and assessment designer with over a decade of experience in creating 
                     effective multiple-choice questions. You specialize in summarizing key points and turning them into 
                     well-structured, concept-checking questions that enhance retention and understanding.""",
        tools=[],
        verbose=True,
        llm=gemini_llm,
    )

    flashcard_generator = Agent(
        role='Memory Reinforcement Specialist',
        goal='Generate concise, high-retention flashcards that simplify and summarize key concepts for effective study',
        backstory="""You are an experienced learning strategist and educator who specializes in breaking down complex ideas 
                    into simple, digestible flashcards. With a focus on clarity and brevity, you help students remember 
                    essential facts and concepts through effective question-answer pairs that improve recall and understanding.""",
        tools=[],
        verbose=True,
        llm=gemini_llm,
    )
    
    return video_researcher, analyst, mcq_generator, flashcard_generator

def create_research_task(cleaned_transcript, video_researcher):
    """Create the research task that analyzes the video transcript"""
    return Task(
        description=f"""
        Analyze the YouTube video transcript for information about the main topics discussed.
        
        Steps:
        1. Read and process the transcript: {cleaned_transcript[:1000]}...
        2. Analyze the content for key concepts mentioned
        3. Focus on:
           - Main topics and concepts discussed
           - Key features of each concept point-wise
           - Use cases or applications shown
           - Important definitions and explanations
        
        Provide a comprehensive summary of all key concepts discussed in the video.
        """,
        expected_output="A detailed summary of the key concepts mentioned in the video, including their features, applications, and any important details.",
        agent=video_researcher,
    )

def process_youtube_video(url: str) -> dict | None:
    """Main function to process YouTube video and generate MCQs"""
    try:
        # Extract video ID
        video_id = extract_youtube_video_id(url)
        if not video_id:
            logger.error("Invalid YouTube URL")
            return None
        
        # Get transcript
        transcript_list = get_video_transcript(video_id)
        if not transcript_list:
            logger.error("Could not fetch transcript")
            return None
        
        # Clean transcript
        cleaned_transcript = " ".join(transcript_list)
        cleaned_transcript = " ".join(cleaned_transcript.split())
        
        # Setup LLM
        gemini_llm = setup_gemini_llm()
        
        # Create agents
        video_researcher, analyst, mcq_generator, flashcard_generator = create_agents(gemini_llm)
        
        # Create tasks
        research_task = create_research_task(cleaned_transcript, video_researcher)
        
        mcq_task = Task(
            description="""Create a set of 10 multiple-choice questions (MCQs) to help a student review and test their 
            understanding of the concepts covered in the video. Ensure questions cover all major topics and vary in difficulty.
            
            Format each question EXACTLY as follows:
            
            1. **Question text here?**
                (A) Option A text
                (B) Option B text  
                (C) Option C text
                (D) Option D text
                **Correct Answer: (X)** Brief explanation here.
            
            Make sure to include the ** markers around "Correct Answer:" and maintain consistent formatting.""",
            context=[research_task],
            agent=mcq_generator,
            expected_output="""
            A markdown-formatted quiz containing 10 MCQs.
            Each question should include:
            - A clearly worded question stem wrapped in **
            - Four options labeled (A) to (D)
            - The correct answer in format **Correct Answer: (X)**
            - A brief explanation for the correct answer
            
            Ensure the questions cover all major ideas and build in difficulty from basic recall to conceptual application.
            """
        )
        
        # Run Crew sequentially: research -> mcq
        crew = Crew(
            agents=[video_researcher, mcq_generator],
            tasks=[research_task, mcq_task],
            verbose=True,
            process=Process.sequential,
            manager_llm=gemini_llm,
        )
        
        result = crew.kickoff(inputs={"transcript": cleaned_transcript})
        
        # MCQ result for frontend
        mcq_result = mcq_task.output.raw if hasattr(mcq_task.output, 'raw') else str(mcq_task.output)
        
        return {
            "mcq_data": mcq_result,
            "video_id": video_id,
            "transcript_length": len(cleaned_transcript)
        }
        
    except Exception as e:
        logger.error(f"Error in process_youtube_video: {str(e)}")
        return None

def process_youtube_video_flashcards(url: str) -> dict | None:
    """Main function to process YouTube video and generate flashcards"""
    try:
        # Extract video ID
        video_id = extract_youtube_video_id(url)
        if not video_id:
            logger.error("Invalid YouTube URL")
            return None
        
        # Get transcript
        transcript_list = get_video_transcript(video_id)
        if not transcript_list:
            logger.error("Could not fetch transcript")
            return None
        
        # Clean transcript
        cleaned_transcript = " ".join(transcript_list)
        cleaned_transcript = " ".join(cleaned_transcript.split())
        
        # Setup LLM
        gemini_llm = setup_gemini_llm()
        
        # Create agents
        video_researcher, analyst, mcq_generator, flashcard_generator = create_agents(gemini_llm)
        
        # Create tasks
        research_task = create_research_task(cleaned_transcript, video_researcher)
        
        flashcard_task = Task(
            description="""Create a set of 15 flashcards to help a student recall and retain key concepts covered in the video. 
            Each flashcard should consist of a concise question and a clear, direct answer. Prioritize clarity, accuracy, and 
            coverage of all major ideas or definitions.

            Format each flashcard EXACTLY as follows:

            1. **What is the main concept?**
            **Answer:** Your concise and accurate answer goes here.

            Make sure to include the ** markers around both the question and "Answer:" and maintain consistent formatting throughout.""",
            
            context=[research_task],
            agent=flashcard_generator,
            
            expected_output="""
            A markdown-formatted list of 15 flashcards.
            Each flashcard must:
            - Begin with numbered format: 1. **Question goes here?**
            - Be followed by **Answer:** and then the answer content
            - Cover key concepts, terms, or facts from the content
            - Use simple, accessible language for better retention

            Ensure coverage of all major points, including definitions, comparisons, processes, and conceptual highlights.
            """
        )
        
        # Run Crew sequentially: research -> flashcards
        crew = Crew(
            agents=[video_researcher, flashcard_generator],
            tasks=[research_task, flashcard_task],
            verbose=True,
            process=Process.sequential,
            manager_llm=gemini_llm,
        )
        
        result = crew.kickoff(inputs={"transcript": cleaned_transcript})
        
        # Flashcard result for frontend
        flashcard_result = flashcard_task.output.raw if hasattr(flashcard_task.output, 'raw') else str(flashcard_task.output)
        
        return {
            "flashcard_data": flashcard_result,
            "video_id": video_id,
            "transcript_length": len(cleaned_transcript)
        }
        
    except Exception as e:
        logger.error(f"Error in process_youtube_video_flashcards: {str(e)}")
        return None
