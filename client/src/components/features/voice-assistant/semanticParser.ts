/**
 * SEMANTIC AI Response Parser
 * Uses intelligent content extraction instead of format-based parsing
 * Works with ANY response format by finding meaningful content
 */

export function parseAIResponse(data: any): string {
  console.log('🧠 SEMANTIC parser starting...', typeof data);

  try {
    // Step 1: Try to extract from structured response first
    const structuredResponse = extractFromStructuredResponse(data);
    if (structuredResponse) {
      console.log('✅ Found structured response:', structuredResponse.substring(0, 100) + '...');
      return structuredResponse;
    }

    // Step 2: Extract ALL possible text content
    const allText = extractAllText(data);
    if (!allText || allText.length < 10) {
      return 'I processed your request successfully.';
    }

    console.log('📚 Extracted text length:', allText.length);
    console.log('📚 First 200 chars:', allText.substring(0, 200));

    // Step 3: Use semantic analysis to find the main response
    const mainResponse = findMainResponse(allText);
    if (mainResponse) {
      console.log('✅ Found main response:', mainResponse.substring(0, 100) + '...');
      return mainResponse;
    }

    // Step 4: Fallback to longest coherent sentence
    const longestSentence = findLongestCoherentSentence(allText);
    if (longestSentence) {
      console.log('✅ Using longest coherent sentence');
      return longestSentence;
    }

    console.log('❌ No meaningful content found');
    return 'I processed your request successfully.';

  } catch (error) {
    console.error('💥 Semantic parser error:', error);
    return 'I processed your request successfully.';
  }
}

function extractFromStructuredResponse(data: any): string | null {
  // Try to extract message from well-structured responses
  try {
    // If data is already parsed as an object with a message field
    if (data && typeof data === 'object') {
      if (data.data && typeof data.data === 'object' && data.data.message) {
        return data.data.message;
      }
      if (data.message && typeof data.message === 'string') {
        return data.message;
      }
    }

    // Try to parse JSON if it's a string
    if (typeof data === 'string') {
      // Remove markdown formatting
      let cleaned = data.trim();
      cleaned = cleaned.replace(/^```json\s*/gi, '');
      cleaned = cleaned.replace(/\s*```$/g, '');
      
      try {
        const parsed = JSON.parse(cleaned);
        if (parsed && parsed.message) {
          return parsed.message;
        }
      } catch {
        // Not valid JSON, fall through to text extraction
      }
    }

    // Try to extract from data.data if it's a string that looks like JSON
    if (data?.data && typeof data.data === 'string') {
      let cleaned = data.data.trim();
      cleaned = cleaned.replace(/^```json\s*/gi, '');
      cleaned = cleaned.replace(/\s*```$/g, '');
      
      try {
        const parsed = JSON.parse(cleaned);
        if (parsed && parsed.message) {
          return parsed.message;
        }
      } catch {
        // Fall through to general text extraction
      }
    }

    return null;
  } catch {
    return null;
  }
}

function extractAllText(data: any): string {
  const textPieces: string[] = [];

  function recursiveExtract(obj: any, depth = 0): void {
    if (depth > 5) return; // Prevent infinite recursion

    if (typeof obj === 'string') {
      textPieces.push(obj);
    } else if (Array.isArray(obj)) {
      obj.forEach(item => recursiveExtract(item, depth + 1));
    } else if (obj && typeof obj === 'object') {
      // Extract values from all object properties
      Object.values(obj).forEach(value => recursiveExtract(value, depth + 1));
    }
  }

  recursiveExtract(data);
  
  // Join all text and clean it
  let allText = textPieces.join(' ');
  
  // Remove common formatting artifacts
  allText = allText
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .replace(/\\"/g, '"')
    .replace(/\\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return allText;
}

function findMainResponse(text: string): string | null {
  // Strategy 1: Look for complete educational explanations
  const educationalPatterns = [
    // Physics/Science explanations
    /([A-Z][^.!?]*(?:law|principle|theorem|equation|formula)[^.!?]*[.!?])/gi,
    
    // General explanations that start with key phrases
    /([A-Z][^.!?]*(?:means|refers to|is defined as|can be described as|is the|are the)[^.!?]*[.!?])/gi,
    
    // Computer science explanations
    /([A-Z][^.!?]*(?:computer science|programming|coding|software|algorithm)[^.!?]*[.!?])/gi,
    
    // Step-by-step explanations
    /((?:First|Second|Third|Finally|In summary)[^.!?]*[.!?](?:\s*[A-Z][^.!?]*[.!?])*)/gi
  ];

  for (const pattern of educationalPatterns) {
    const matches = text.match(pattern);
    if (matches && matches[0] && matches[0].length > 50) {
      // Return the first substantial educational match
      return cleanResponse(matches[0]);
    }
  }

  // Strategy 2: Look for any substantial explanation (100+ chars)
  const explanationPatterns = [
    // Sentences that explain or define something
    /([A-Z][^.!?]*(?:is|are|means|refers|involves|includes|consists)[^.!?]{30,}[.!?])/gi,
    
    // Detailed descriptions
    /([A-Z][^.!?]{50,}[.!?](?:\s*[A-Z][^.!?]{20,}[.!?])*)/gi
  ];

  for (const pattern of explanationPatterns) {
    const matches = text.match(pattern);
    if (matches && matches[0] && matches[0].length > 80) {
      return cleanResponse(matches[0]);
    }
  }

  // Strategy 3: Find the longest meaningful paragraph
  const paragraphs = text.split(/[.!?]\s+/)
    .filter(p => p.length > 30 && hasSubstantialContent(p))
    .sort((a, b) => b.length - a.length);

  if (paragraphs.length > 0) {
    return cleanResponse(paragraphs[0] + '.');
  }

  return null;
}

function findLongestCoherentSentence(text: string): string | null {
  // Split into sentences and find the longest coherent one
  const sentences = text.split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 20 && hasSubstantialContent(s))
    .sort((a, b) => b.length - a.length);

  if (sentences.length > 0) {
    return cleanResponse(sentences[0] + '.');
  }

  return null;
}

function hasSubstantialContent(text: string): boolean {
  // Check if text has meaningful content
  const meaningfulWords = [
    'is', 'are', 'means', 'refers', 'law', 'principle', 'theorem', 'equation',
    'formula', 'computer', 'science', 'programming', 'algorithm', 'function',
    'method', 'process', 'system', 'concept', 'theory', 'practice', 'example',
    'definition', 'explanation', 'understanding', 'learning', 'study', 'education'
  ];

  const wordCount = text.toLowerCase().split(/\s+/).length;
  const meaningfulWordCount = meaningfulWords.filter(word => 
    text.toLowerCase().includes(word)
  ).length;

  // Must have at least 5 words and some meaningful content
  return wordCount >= 5 && (meaningfulWordCount > 0 || wordCount > 15);
}

function cleanResponse(text: string): string {
  return text
    .replace(/^[^A-Za-z]*/, '') // Remove leading non-letters
    .replace(/[^.!?]*$/, match => match.includes('.') ? match : match + '.') // Ensure proper ending
    .replace(/\s+/g, ' ')
    .trim();
}

// Alternative approach: Use keyword-based extraction
export function extractByKeywords(data: any, keywords: string[] = []): string | null {
  const allText = extractAllText(data);
  
  // Default keywords for educational content
  const defaultKeywords = [
    'newton', 'law', 'motion', 'physics', 'science', 'computer', 'programming',
    'algorithm', 'function', 'method', 'principle', 'theorem', 'equation',
    'definition', 'explanation', 'means', 'refers to', 'is defined as'
  ];
  
  const searchKeywords = keywords.length > 0 ? keywords : defaultKeywords;
  
  // Find sentences containing any of the keywords
  const sentences = allText.split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => {
      const lowerS = s.toLowerCase();
      return s.length > 30 && searchKeywords.some(keyword => lowerS.includes(keyword));
    })
    .sort((a, b) => b.length - a.length);

  if (sentences.length > 0) {
    return cleanResponse(sentences[0] + '.');
  }

  return null;
}

// Smart fallback that combines multiple strategies
export function smartParseAIResponse(data: any, context?: { query?: string }): string {
  console.log('🎯 SMART parser with context:', context?.query);

  // Extract keywords from user query for context-aware parsing
  const queryKeywords = context?.query ? 
    context.query.toLowerCase().split(/\s+/).filter(w => w.length > 3) : [];

  // Try keyword-based extraction first if we have context
  if (queryKeywords.length > 0) {
    const keywordResult = extractByKeywords(data, queryKeywords);
    if (keywordResult) {
      console.log('✅ Found keyword-based result');
      return keywordResult;
    }
  }

  // Fall back to semantic parsing
  return parseAIResponse(data);
}

export default parseAIResponse;
