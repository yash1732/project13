import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
api_key=os.getenv("GOOGLE_API_KEY")

if not api_key:
    print("❌ Error: GOOGLE_API_KEY not found in .env file")
    exit()

genai.configure(api_key=api_key)

def transcribe_audio(audio_path):
    """
    Sends audio to Gemini 1.5 Flash and gets a transcription.
    """
    print(f'🚀 Uploading {audio_path} to Gemini...')

    myfile= genai.upload_file(audio_path)
    print(f'✅ Upload complete: {myfile.name}')

    model= genai.GenerativeModel('gemini-flash-latest')

    prompt = """
    Listen to this audio. It may contain English or Indian regional languages. 
    Your goal is to provide a comprehensive English text output.
    
    If the audio is non-English, translate it into English. 
    If it is mixed, unify it into fluent English. 
    Output ONLY the plain English text, nothing else.
    """
    
    print('🤖 Analyzing audio...')
    result= model.generate_content(
        [myfile, prompt]
    )

    return result.text

# Test Block
if __name__=='__main__':
    test_file='backend\\ml\\incident_ai\\test_audio2.m4a'

    if os.path.exists(test_file):
        print("\n--- RESULT ---")
        print(transcribe_audio(test_file))
        print("--------------")
    
    else:
        print(f"❌ Error: Could not find '{test_file}'. Please record a voice note and save it here.")