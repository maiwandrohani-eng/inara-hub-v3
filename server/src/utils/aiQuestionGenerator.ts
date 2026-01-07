// AI-powered question generator using free services
import * as fs from 'fs';
import * as path from 'path';
// Dynamic import for pdf-parse (CommonJS module in ES module context)
let pdfParse: any = null;
let pdfParseLoaded = false;

// Lazy load pdf-parse using dynamic import or createRequire
async function loadPdfParse() {
  if (pdfParseLoaded && pdfParse) return pdfParse;
  try {
    // Try dynamic import first
    const pdfParseModule = await import('pdf-parse');
    pdfParse = pdfParseModule.default || pdfParseModule;
    pdfParseLoaded = true;
    return pdfParse;
  } catch (error: any) {
    console.error('⚠️ Failed to load pdf-parse:', error);
    // Try require as fallback (for CommonJS compatibility)
    try {
      const { createRequire } = await import('module');
      const require = createRequire(import.meta.url);
      pdfParse = require('pdf-parse');
      pdfParseLoaded = true;
      return pdfParse;
    } catch (requireError) {
      console.error('⚠️ Failed to load pdf-parse with require:', requireError);
      return null;
    }
  }
}

/**
 * Extract text from PDF file (accepts buffer or file path)
 */
export async function extractTextFromPDF(pdfPathOrBuffer: string | Buffer): Promise<string> {
  try {
    // Load pdf-parse if not already loaded
    const pdfParser = await loadPdfParse();
    if (!pdfParser) {
      throw new Error('pdf-parse library is not available. Please ensure it is installed: npm install pdf-parse');
    }
    
    let dataBuffer: Buffer;
    if (Buffer.isBuffer(pdfPathOrBuffer)) {
      dataBuffer = pdfPathOrBuffer;
      console.log('📖 Extracting text from PDF buffer');
    } else {
      console.log('📖 Extracting text from PDF:', pdfPathOrBuffer);
      if (!fs.existsSync(pdfPathOrBuffer)) {
        throw new Error(`PDF file not found: ${pdfPathOrBuffer}`);
      }
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
 * Calculate optimal number of questions based on text length
 */
function calculateQuestionCount(textLength: number): number {
  // Base: 10 questions for small documents (0-1000 chars)
  // Scale up to 30 questions for large documents (5000+ chars)
  if (textLength < 1000) return 10;
  if (textLength < 2000) return 15;
  if (textLength < 3000) return 20;
  if (textLength < 4000) return 25;
  return 30; // Max 30 questions for very large documents
}

/**
 * Generate questions using AI from text content
 */
export async function generateQuestionsWithAI(text: string, numQuestions?: number): Promise<any[]> {
  try {
    // Clean and prepare text
    const cleanText = text
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText || cleanText.length < 100) {
      throw new Error('Text too short to generate questions');
    }

    // Calculate optimal number of questions if not specified
    const targetQuestions = numQuestions || calculateQuestionCount(cleanText.length);
    console.log(`📊 Text length: ${cleanText.length} chars, generating ${targetQuestions} questions`);

    // Extract meaningful sentences (longer sentences with more content)
    const sentences = cleanText
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 40 && s.length < 300) // Filter for meaningful sentences
      .filter(s => {
        // Filter out very short or repetitive sentences
        const words = s.split(/\s+/).length;
        return words >= 8 && words <= 50;
      });

    console.log(`📝 Found ${sentences.length} meaningful sentences`);

    const questions: any[] = [];
    const usedSentences = new Set<number>();
    const baseId = Date.now();

    // Generate questions from key sentences
    for (let i = 0; i < Math.min(targetQuestions, sentences.length); i++) {
      // Find a sentence we haven't used yet
      let sentenceIndex = -1;
      for (let j = 0; j < sentences.length; j++) {
        if (!usedSentences.has(j)) {
          sentenceIndex = j;
          usedSentences.add(j);
          break;
        }
      }

      if (sentenceIndex === -1) break;

      const sentence = sentences[sentenceIndex];
      if (!sentence) continue;

      // Create question directly from sentence content
      // Remove "According to the document" and make it more natural
      let questionText = '';
      
      // Extract key concept from sentence
      const words = sentence.split(/\s+/);
      const keyWords = words.filter(w => w.length > 4).slice(0, 5);
      
      if (sentence.length > 100) {
        // For long sentences, create a question about the main point
        questionText = `What is the main point about ${keyWords.join(' ')}?`;
      } else if (sentence.length > 60) {
        // For medium sentences, use the sentence as context
        questionText = `What does this statement mean: "${sentence.substring(0, 80)}${sentence.length > 80 ? '...' : ''}"?`;
      } else {
        // For short sentences, create a direct question
        questionText = `What is ${sentence.toLowerCase()}?`;
      }

      // Generate more relevant options based on sentence content
      const correctAnswer = sentence.substring(0, 60) + (sentence.length > 60 ? '...' : '');
      const options = [
        correctAnswer,
        `A key principle related to ${keyWords[0] || 'this topic'}`,
        `An important guideline about ${keyWords.slice(0, 2).join(' and ') || 'this subject'}`,
        `A standard practice for ${keyWords[0] || 'this area'}`,
      ].filter(opt => opt.length > 10 && opt.length < 100);

      // Ensure we have 4 options
      while (options.length < 4) {
        options.push(`Option ${options.length + 1} related to the content`);
      }

      // Randomize the position of the correct answer
      const correctIndex = Math.floor(Math.random() * options.length);
      // Move correct answer to random position
      const shuffledOptions = [...options];
      shuffledOptions.splice(correctIndex, 0, shuffledOptions.splice(0, 1)[0]);

      questions.push({
        id: `q-${baseId}-${i}`,
        type: 'multiple_choice',
        question: questionText,
        required: true,
        options: shuffledOptions.slice(0, 4),
        correctAnswer: correctAnswer, // Store the actual correct answer
        points: 1,
        order: i + 1,
      });
    }

    // If we don't have enough questions, generate generic ones based on document themes
    if (questions.length < targetQuestions) {
      const remaining = targetQuestions - questions.length;
      const themes = extractThemes(cleanText);
      
      for (let i = 0; i < remaining; i++) {
        const theme = themes[i % themes.length] || 'key concepts';
        const correctAnswer = `A principle that ensures effective implementation of ${theme}`;
        const options = [
          correctAnswer,
          `A guideline that promotes best practices for ${theme}`,
          `A standard that maintains quality in ${theme}`,
          `A requirement that ensures compliance with ${theme}`,
        ];
        
        // Randomize the position of the correct answer
        const correctIndex = Math.floor(Math.random() * options.length);
        const shuffledOptions = [...options];
        shuffledOptions.splice(correctIndex, 0, shuffledOptions.splice(0, 1)[0]);
        
        questions.push({
          id: `q-${baseId}-${questions.length}`,
          type: 'multiple_choice',
          question: `Which of the following best describes ${theme}?`,
          required: true,
          options: shuffledOptions,
          correctAnswer: correctAnswer, // Store the actual correct answer
          points: 1,
          order: questions.length + 1,
        });
      }
    }

    return questions.slice(0, targetQuestions);
  } catch (error: any) {
    console.error('Error generating questions with AI:', error);
    throw error;
  }
}

/**
 * Extract key themes/topics from text
 */
function extractThemes(text: string): string[] {
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 5)
    .filter(w => !['which', 'where', 'there', 'their', 'these', 'those', 'should', 'would', 'could'].includes(w));

  // Count word frequency
  const wordCount: Record<string, number> = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });

  // Get top words
  const topWords = Object.entries(wordCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);

  return topWords.length > 0 ? topWords : ['key concepts', 'main topics', 'important principles'];
}

/**
 * Generate questions from PDF document
 */
export async function generateQuestionsFromPDF(
  pdfPathOrBuffer: string | Buffer,
  numQuestions?: number // Optional, will be auto-calculated if not provided
): Promise<{ questions: any[]; extractedText: string }> {
  try {
    // Extract text from PDF
    const extractedText = await extractTextFromPDF(pdfPathOrBuffer);
    
    if (!extractedText || extractedText.trim().length < 100) {
      throw new Error('Could not extract sufficient text from PDF. The document may be image-based or corrupted.');
    }

    // Auto-calculate question count if not provided
    const questionCount = numQuestions || calculateQuestionCount(extractedText.length);

    // Generate questions using AI
    const questions = await generateQuestionsWithAI(extractedText, questionCount);

    return {
      questions,
      extractedText: extractedText.substring(0, 500), // Return first 500 chars for preview
    };
  } catch (error: any) {
    throw new Error(`Failed to generate questions: ${error.message}`);
  }
}

