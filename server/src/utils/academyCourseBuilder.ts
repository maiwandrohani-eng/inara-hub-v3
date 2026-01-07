// INARA Academy - Smart Course Builder
// Converts Word/PDF files into interactive courses with slides and quizzes

import * as fs from 'fs';
import * as path from 'path';

// Dynamic import for pdf-parse (ES module compatible)
let pdfParse: any = null;
let pdfParseLoaded = false;

async function loadPdfParse() {
  if (pdfParseLoaded) return pdfParse;
  
  try {
    // Use dynamic import for ES modules
    const pdfParseModule = await import('pdf-parse');
    // Handle both ESM and CommonJS exports
    pdfParse = (pdfParseModule as any).default || pdfParseModule;
    pdfParseLoaded = true;
    return pdfParse;
  } catch (error: any) {
    console.error('⚠️ Failed to load pdf-parse:', error);
    // Try require as fallback (for CommonJS compatibility)
    try {
      // Use type assertion to handle module import
      const module = await import('module');
      const createRequire = (module as any).createRequire || (module.default as any)?.createRequire;
      if (createRequire) {
        const require = createRequire(import.meta.url);
        pdfParse = require('pdf-parse');
        pdfParseLoaded = true;
        return pdfParse;
      }
      return null;
    } catch (requireError) {
      console.error('⚠️ Failed to load pdf-parse with require:', requireError);
      return null;
    }
  }
}

// AI API configuration - supports multiple providers
const AI_API_KEY = process.env.AI_API_KEY || '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';
const AI_API_URL = process.env.AI_API_URL || 'https://api.openai.com/v1/chat/completions';
const AI_MODEL = process.env.AI_MODEL || 'gpt-3.5-turbo';

// Detect Hugging Face endpoints
const isHuggingFaceRouter = AI_API_URL.includes('router.huggingface.co');
const isHuggingFaceInference = AI_API_URL.includes('api-inference.huggingface.co') || 
                                (AI_API_URL.includes('huggingface.co') && !isHuggingFaceRouter);
const isHuggingFace = isHuggingFaceRouter || isHuggingFaceInference;

/**
 * Normalize model name for Hugging Face router
 * Converts short names like "mistral-7b-instruct" to full paths like "mistralai/Mistral-7B-Instruct-v0.1"
 */
function normalizeModelName(modelName: string): string {
  if (!isHuggingFace) {
    return modelName; // No normalization needed for non-HF APIs
  }

  const modelLower = modelName.toLowerCase();
  
  // Common model name mappings for Hugging Face
  const modelMappings: { [key: string]: string } = {
    'mistral-7b-instruct': 'mistralai/Mistral-7B-Instruct-v0.1',
    'mistral-7b': 'mistralai/Mistral-7B-Instruct-v0.1',
    'mistral7b': 'mistralai/Mistral-7B-Instruct-v0.1',
    'mistral': 'mistralai/Mistral-7B-Instruct-v0.1',
  };

  // Check if it's already a full path (contains /)
  if (modelName.includes('/')) {
    return modelName;
  }

  // Check mappings
  if (modelMappings[modelLower]) {
    return modelMappings[modelLower];
  }

  // Default fallback for Mistral models
  if (modelLower.includes('mistral')) {
    return 'mistralai/Mistral-7B-Instruct-v0.1';
  }

  // Return as-is if no mapping found (might be a valid full path already)
  return modelName;
}

interface Slide {
  title: string;
  content: string;
  order: number;
  slideType: 'content' | 'video' | 'interactive';
  mediaUrl?: string;
}

interface MicroQuiz {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface Lesson {
  title: string;
  order: number;
  content?: string;
  slides: Slide[];
}

interface CourseStructure {
  title: string;
  description: string;
  objectives: string[];
  lessons: Lesson[];
  finalExam: {
    questions: Array<{
      question: string;
      options: string[];
      correctAnswer: number;
      explanation?: string;
    }>;
    passingScore: number;
  };
}

/**
 * Extract text from PDF file (accepts buffer or file path)
 */
export async function extractTextFromPDF(pdfPathOrBuffer: string | Buffer): Promise<string> {
  try {
    // Load pdf-parse dynamically
    const pdfParser = await loadPdfParse();
    if (!pdfParser) {
      throw new Error('pdf-parse library is not available. Please ensure it is installed: npm install pdf-parse');
    }

    let dataBuffer: Buffer;
    if (Buffer.isBuffer(pdfPathOrBuffer)) {
      dataBuffer = pdfPathOrBuffer;
      console.log('📖 Extracting text from PDF buffer');
    } else {
      if (!fs.existsSync(pdfPathOrBuffer)) {
        throw new Error(`PDF file not found: ${pdfPathOrBuffer}`);
      }
      console.log('📖 Extracting text from PDF:', pdfPathOrBuffer);
      dataBuffer = fs.readFileSync(pdfPathOrBuffer);
    }
    
    console.log('📦 PDF file size:', dataBuffer.length, 'bytes');
    
    const data = await pdfParser(dataBuffer);
    const extractedText = data.text || '';

    console.log('✅ Text extracted, length:', extractedText.length, 'characters');
    console.log('📝 First 200 chars:', extractedText.substring(0, 200));

    if (!extractedText || extractedText.trim().length < 50) {
      throw new Error('PDF appears to be image-based or empty. Could not extract sufficient text.');
    }

    return extractedText;
  } catch (error: any) {
    console.error('❌ PDF extraction error:', error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

/**
 * Extract text from Word document (.docx) using mammoth (accepts buffer or file path)
 */
export async function extractTextFromWord(docxPathOrBuffer: string | Buffer): Promise<string> {
  try {
    // Dynamic import for mammoth (ES module)
    let mammoth: any;
    try {
      mammoth = await import('mammoth');
    } catch (importError: any) {
      console.error('Mammoth import error:', importError);
      throw new Error('mammoth library is not available. Please install it: npm install mammoth');
    }

    let dataBuffer: Buffer;
    if (Buffer.isBuffer(docxPathOrBuffer)) {
      dataBuffer = docxPathOrBuffer;
      console.log('📄 Extracting text from Word document buffer');
    } else {
      if (!fs.existsSync(docxPathOrBuffer)) {
        throw new Error(`Word document not found: ${docxPathOrBuffer}`);
      }
      console.log('📄 Extracting text from Word document:', docxPathOrBuffer);
      dataBuffer = fs.readFileSync(docxPathOrBuffer);
    }
    
    console.log('📦 Word file size:', dataBuffer.length, 'bytes');

    // Convert .docx to text using mammoth
    // mammoth.extractRawText can take a buffer or path
    const result = await mammoth.extractRawText({ buffer: dataBuffer });
    const extractedText = result.value || '';

    // Check for warnings
    if (result.messages && result.messages.length > 0) {
      console.warn('⚠️ Mammoth warnings:', result.messages);
    }

    console.log('✅ Text extracted from Word, length:', extractedText.length, 'characters');
    console.log('📝 First 200 chars:', extractedText.substring(0, 200));

    if (!extractedText || extractedText.trim().length < 50) {
      throw new Error('Word document appears to be empty or could not extract sufficient text.');
    }

    return extractedText;
  } catch (error: any) {
    console.error('❌ Word extraction error:', error);
    throw new Error(`Failed to extract text from Word: ${error.message}`);
  }
}

/**
 * Call AI API to generate course structure
 */
async function generateCourseWithAI(text: string, courseType: string): Promise<CourseStructure> {
  try {
    const prompt = `You are an expert instructional designer. Convert the following document content into a structured online course.

Document Content:
${text.substring(0, 10000)}${text.length > 10000 ? '...' : ''}

Course Type: ${courseType}

Please create:
1. A course title and description
2. Learning objectives (3-5 key objectives)
3. Break content into logical lessons (3-8 lessons)
4. For each lesson, create 3-6 slides with clear titles and content
5. After each slide, suggest a micro-quiz question (multiple choice, 4 options)
6. Create a final exam with 10-15 questions covering all key concepts

Return ONLY valid JSON in this exact format:
{
  "title": "Course Title",
  "description": "Course description",
  "objectives": ["objective1", "objective2"],
  "lessons": [
    {
      "title": "Lesson Title",
      "order": 1,
      "content": "Lesson overview",
      "slides": [
        {
          "title": "Slide Title",
          "content": "Slide content (detailed, educational)",
          "order": 1,
          "slideType": "content"
        }
      ]
    }
  ],
  "finalExam": {
    "questions": [
      {
        "question": "Question text",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": 0,
        "explanation": "Why this is correct"
      }
    ],
    "passingScore": 70
  }
}`;

    // Prepare request based on API provider
    let requestBody: any;
    let headers: any = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AI_API_KEY}`,
    };

    // Determine the actual API URL (handle old inference endpoint migration)
    let actualApiUrl = AI_API_URL;
    if (isHuggingFaceInference) {
      // Old inference endpoint is deprecated, suggest migration
      console.warn('⚠️ Using deprecated Hugging Face inference endpoint. Please update AI_API_URL to use router.huggingface.co');
      // Try to extract model name and convert to router format
      const modelMatch = AI_API_URL.match(/models\/([^\/]+)/);
      if (modelMatch) {
        const modelName = modelMatch[1];
        actualApiUrl = `https://router.huggingface.co/v1/chat/completions`;
        console.log(`🔄 Auto-migrating to router endpoint with model: ${modelName}`);
      }
    }

    if (isHuggingFaceRouter || (isHuggingFaceInference && actualApiUrl.includes('router.huggingface.co'))) {
      // New router endpoint uses OpenAI-compatible format
      const normalizedModel = normalizeModelName(AI_MODEL || 'mistralai/Mistral-7B-Instruct-v0.1');
      requestBody = {
        model: normalizedModel,
        messages: [
          {
            role: 'system',
            content: 'You are an expert instructional designer. Always return valid JSON only, no markdown formatting.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      };
    } else if (isHuggingFaceInference) {
      // Old Hugging Face Inference API format (deprecated)
      const fullPrompt = `You are an expert instructional designer. Convert the following document content into a structured online course.

${prompt}

Return ONLY valid JSON in this exact format (no markdown, no code blocks, just pure JSON):
{
  "title": "Course Title",
  "description": "Course description",
  "objectives": ["objective1", "objective2"],
  "lessons": [
    {
      "title": "Lesson Title",
      "order": 1,
      "content": "Lesson overview",
      "slides": [
        {
          "title": "Slide Title",
          "content": "Slide content (detailed, educational)",
          "order": 1,
          "slideType": "content"
        }
      ]
    }
  ],
  "finalExam": {
    "questions": [
      {
        "question": "Question text",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": 0,
        "explanation": "Why this is correct"
      }
    ],
    "passingScore": 70
  }
}`;

      requestBody = {
        inputs: fullPrompt,
        parameters: {
          max_new_tokens: 4000,
          temperature: 0.7,
          return_full_text: false,
        },
      };
    } else {
      // OpenAI-compatible format
      requestBody = {
        model: AI_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are an expert instructional designer. Always return valid JSON only, no markdown formatting.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      };
    }

    const response = await fetch(actualApiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `AI API error: ${response.status} - ${errorText}`;
      
      // Provide helpful error messages
      if (response.status === 401) {
        errorMessage += '\n\n❌ Invalid API key. Please check your AI_API_KEY in .env file.';
        errorMessage += '\n💡 Get an OpenAI API key from: https://platform.openai.com/api-keys';
      } else if (response.status === 410 && isHuggingFaceInference) {
        errorMessage += '\n\n⚠️ The Hugging Face inference endpoint is deprecated.';
        errorMessage += '\n💡 Please update your .env file:';
        errorMessage += '\n   AI_API_URL=https://router.huggingface.co/v1/chat/completions';
        errorMessage += '\n   AI_MODEL=mistralai/Mistral-7B-Instruct-v0.1';
      } else if (response.status === 400 && errorText.includes('model_not_found')) {
        errorMessage += '\n\n⚠️ Invalid model name.';
        errorMessage += '\n💡 For Hugging Face router, use full model path like:';
        errorMessage += '\n   AI_MODEL=mistralai/Mistral-7B-Instruct-v0.1';
        errorMessage += '\n   (Not just "mistral-7b-instruct")';
      } else if (response.status === 429) {
        errorMessage += '\n\n⚠️ Rate limit exceeded. Please try again later or upgrade your API plan.';
      } else if (response.status === 402) {
        errorMessage += '\n\n⚠️ Payment required. Please add credits to your API account.';
      }
      
      console.error('❌ AI API Error:', errorMessage);
      throw new Error(errorMessage);
    }

    const data = await response.json() as any;
    
    // Extract response based on API provider
    let aiResponse = '';
    if (isHuggingFaceRouter || (isHuggingFaceInference && actualApiUrl.includes('router.huggingface.co'))) {
      // Router endpoint uses OpenAI-compatible format
      aiResponse = data.choices?.[0]?.message?.content || '';
    } else if (isHuggingFaceInference) {
      // Old Hugging Face inference endpoint format
      if (Array.isArray(data) && data[0]?.generated_text) {
        aiResponse = data[0].generated_text;
      } else if (data.generated_text) {
        aiResponse = data.generated_text;
      } else if (data[0]?.generated_text) {
        aiResponse = data[0].generated_text;
      } else {
        throw new Error('Unexpected Hugging Face response format: ' + JSON.stringify(data));
      }
    } else {
      // OpenAI-compatible format
      aiResponse = data.choices?.[0]?.message?.content || '';
    }

    // Extract JSON from response (handle markdown code blocks)
    let jsonText = aiResponse.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    const courseStructure: CourseStructure = JSON.parse(jsonText);

    // Add micro quizzes after each slide
    for (const lesson of courseStructure.lessons) {
      for (let i = 0; i < lesson.slides.length; i++) {
        const slide = lesson.slides[i];
        // Generate micro quiz for this slide using AI
        const quizPrompt = `Based on this slide content, create ONE multiple-choice quiz question with 4 options and the correct answer index (0-3).

Slide Title: ${slide.title}
Slide Content: ${slide.content}

Return ONLY JSON:
{
  "question": "Question text",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": 0,
  "explanation": "Brief explanation"
}`;

        try {
          // Prepare quiz request
          let quizRequestBody: any;
          let quizApiUrl = actualApiUrl;
          
          if (isHuggingFaceRouter || (isHuggingFaceInference && actualApiUrl.includes('router.huggingface.co'))) {
            // New router endpoint uses OpenAI-compatible format
            const normalizedModel = normalizeModelName(AI_MODEL || 'mistralai/Mistral-7B-Instruct-v0.1');
            quizRequestBody = {
              model: normalizedModel,
              messages: [
                {
                  role: 'system',
                  content: 'Return only valid JSON, no markdown.',
                },
                {
                  role: 'user',
                  content: quizPrompt,
                },
              ],
              temperature: 0.7,
              max_tokens: 500,
            };
          } else if (isHuggingFaceInference) {
            // Old inference endpoint format
            const fullQuizPrompt = `${quizPrompt}\n\nReturn ONLY valid JSON (no markdown, no code blocks):`;
            quizRequestBody = {
              inputs: fullQuizPrompt,
              parameters: {
                max_new_tokens: 500,
                temperature: 0.7,
                return_full_text: false,
              },
            };
          } else {
            // OpenAI-compatible format
            quizRequestBody = {
              model: AI_MODEL,
              messages: [
                {
                  role: 'system',
                  content: 'Return only valid JSON, no markdown.',
                },
                {
                  role: 'user',
                  content: quizPrompt,
                },
              ],
              temperature: 0.7,
              max_tokens: 500,
            };
          }

          const quizResponse = await fetch(quizApiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${AI_API_KEY}`,
            },
            body: JSON.stringify(quizRequestBody),
          });

          if (quizResponse.ok) {
            const quizData: any = await quizResponse.json();
            let quizText = '';
            const typedQuizData = quizData;
            
            if (isHuggingFaceRouter || (isHuggingFaceInference && actualApiUrl.includes('router.huggingface.co'))) {
              // Router endpoint uses OpenAI-compatible format
              quizText = typedQuizData.choices?.[0]?.message?.content || '';
            } else if (isHuggingFaceInference) {
              // Old inference endpoint format
              if (Array.isArray(typedQuizData) && typedQuizData[0]?.generated_text) {
                quizText = typedQuizData[0].generated_text;
              } else if (typedQuizData.generated_text) {
                quizText = typedQuizData.generated_text;
              }
            } else {
              // OpenAI-compatible format
              quizText = typedQuizData.choices?.[0]?.message?.content || '';
            }
            
            // Clean up JSON
            if (quizText.startsWith('```json')) {
              quizText = quizText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            } else if (quizText.startsWith('```')) {
              quizText = quizText.replace(/```\n?/g, '');
            }
            
            try {
              const microQuiz = JSON.parse(quizText);
              (slide as any).microQuiz = microQuiz;
            } catch (parseError) {
              console.warn('Failed to parse micro quiz JSON:', parseError);
            }
          }
        } catch (error) {
          console.error('Failed to generate micro quiz for slide:', error);
        }
      }
    }

    return courseStructure;
  } catch (error: any) {
    console.error('AI course generation error:', error);
    // Fallback to basic structure
    return createBasicCourseStructure(text, courseType);
  }
}

/**
 * Create basic course structure as fallback
 */
function createBasicCourseStructure(text: string, courseType: string): CourseStructure {
  // Split text into paragraphs
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 50);
  
  // Create slides from paragraphs (3-4 paragraphs per slide)
  const slidesPerLesson = 4;
  const lessons: Lesson[] = [];
  
  for (let i = 0; i < paragraphs.length; i += slidesPerLesson) {
    const lessonParagraphs = paragraphs.slice(i, i + slidesPerLesson);
    const slides: Slide[] = lessonParagraphs.map((para, idx) => ({
      title: `Slide ${idx + 1}`,
      content: para.trim(),
      order: idx + 1,
      slideType: 'content' as const,
    }));

    lessons.push({
      title: `Lesson ${Math.floor(i / slidesPerLesson) + 1}`,
      order: Math.floor(i / slidesPerLesson) + 1,
      slides,
    });
  }

  return {
    title: 'Course Title',
    description: 'Course generated from document',
    objectives: ['Understand key concepts', 'Apply knowledge', 'Demonstrate competency'],
    lessons,
    finalExam: {
      questions: [],
      passingScore: 70,
    },
  };
}

/**
 * Main function: Convert document to course structure
 */
export async function buildCourseFromDocument(
  filePathOrBuffer: string | Buffer,
  courseType: string = 'PROFESSIONAL_COURSE',
  filename?: string
): Promise<CourseStructure> {
  try {
    let ext: string;
    if (Buffer.isBuffer(filePathOrBuffer)) {
      // Get extension from filename or default to .pdf
      ext = filename ? path.extname(filename).toLowerCase() : '.pdf';
    } else {
      ext = path.extname(filePathOrBuffer).toLowerCase();
    }
    
    let text = '';

    if (ext === '.pdf') {
      text = await extractTextFromPDF(filePathOrBuffer);
    } else if (ext === '.docx' || ext === '.doc') {
      text = await extractTextFromWord(filePathOrBuffer);
    } else {
      throw new Error(`Unsupported file type: ${ext}`);
    }

    if (!text || text.trim().length < 100) {
      throw new Error('Document appears to be empty or could not extract sufficient text');
    }

    // Generate course structure using AI
    const courseStructure = await generateCourseWithAI(text, courseType);

    return courseStructure;
  } catch (error: any) {
    console.error('Course building error:', error);
    throw error;
  }
}

/**
 * Build course from text content (for paste functionality)
 */
export async function buildCourseFromText(
  textContent: string,
  courseType: string = 'PROFESSIONAL_COURSE'
): Promise<CourseStructure> {
  try {
    if (!textContent || textContent.trim().length < 100) {
      throw new Error('Text content appears to be empty or too short (minimum 100 characters)');
    }

    // Check word count (100,000 words max)
    const wordCount = textContent.trim().split(/\s+/).length;
    if (wordCount > 100000) {
      throw new Error(`Text content exceeds maximum of 100,000 words (current: ${wordCount} words)`);
    }

    console.log(`📝 Building course from text content (${wordCount} words)`);

    // Generate course structure using AI
    const courseStructure = await generateCourseWithAI(textContent, courseType);

    return courseStructure;
  } catch (error: any) {
    console.error('Course building from text error:', error);
    throw error;
  }
}

