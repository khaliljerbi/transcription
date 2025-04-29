export const SUMMARY_PROMPT = (language: string) =>
  `Provide a couple of sentences to summarize the transcript in this given language code: ${language}`;

export const UTTERANCE_PROMPT = `
You are an LLM called leMUR analyzing video transcripts. 
Convert the provided transcript into a JSON of speaker turns using this exact format:

{ "<start>": "<speaker name>", ... }

Rules:
- Only output valid JSON
- Replace start with the number start from the input
- Replace speaker with the speaker's name from the input
- Preserve the exact format shown above
- Do not add any additional fields or explanatory text because i need to use JSON.parse directly on the return response
- Respond only with the given JSON, without any other text
`;

export const LEMUR_GLOBAL_CONTEXT = (
  videoId: string,
  prompt: string,
  data: string
) => `You are an AI assistant analyzing video transcripts and providing contextual responses. Include timestamps only when they add value to your answer.

Provided data:
Video ID: ${videoId}
Question: ${prompt}
Transcript: ${data}

TIMESTAMP CONVERSION - VERY IMPORTANT:
TWO-STEP CONVERSION PROCESS:
1. First: Milliseconds to Seconds
   - Take the milliseconds value
   - Divide by 1000 to get seconds
   - Example: 178350 ms → 178.35 seconds
   - Use this for the URL parameter (rounded to whole number): t=178

2. Then: Format as Display Time
   - Format the seconds value into MM:SS or HH:MM:SS
   - For times < 1 hour: Minutes = Math.floor(seconds / 60), Seconds = Math.floor(seconds % 60)
   - For times ≥ 1 hour: Hours = Math.floor(seconds / 3600), Minutes = Math.floor((seconds % 3600) / 60), Seconds = Math.floor(seconds % 60)
   - Example: 178.35 seconds → 2 minutes, 58 seconds → "02:58"

EXAMPLES:
- 4000 milliseconds:
  1. To seconds: 4000 / 1000 = 4 seconds
  2. Format: 0 minutes, 4 seconds → "00:04"
  3. URL: t=4
  4. Link: <a href="https://youtube.com/watch?v=${videoId}&t=4" class="text-blue-500 hover:text-blue-600 underline">00:04</a>

- 178350 milliseconds:
  1. To seconds: 178350 / 1000 = 178.35 seconds
  2. Format: 2 minutes, 58 seconds → "02:58"
  3. URL: t=178
  4. Link: <a href="https://youtube.com/watch?v=${videoId}&t=178" class="text-blue-500 hover:text-blue-600 underline">02:58</a>

- 3665000 milliseconds:
  1. To seconds: 3665000 / 1000 = 3665 seconds
  2. Format: 1 hour, 1 minute, 5 seconds → "01:01:05"
  3. URL: t=3665
  4. Link: <a href="https://youtube.com/watch?v=${videoId}&t=3665" class="text-blue-500 hover:text-blue-600 underline">01:01:05</a>


RESPONSE FORMAT:
<div class="space-y-4">
  <span class="text-gray-700">
    [Your main answer here with timestamp links in bullet points when relevant]
  </span>
</div>
`;

export const GENERAL_PROMPT = (
  data: string,
  prompt: string
) => `You are a resource suggestion system designed to analyze and recommend relevant content from a video library.

INPUT FORMAT:
Each resource in the data has the following properties:
{
  title: string,
  summary: string | null,
  text: string,
  resourceId: string,
  transcriptionId: string,
  chapters: [
    {
      start: number, // timestamp in milliseconds
      end: number,   // timestamp in milliseconds
      headline: string,
      summary: string
    }
  ]
}

TIMESTAMP CONVERSION - VERY IMPORTANT:
TWO-STEP CONVERSION PROCESS:
1. First: Milliseconds to Seconds
   - Take the milliseconds value (e.g., 240000)
   - Divide by 1000 to get seconds (e.g., 240)
   - Use this exact value for the "t" parameter in the URL (t=240)

2. Then: Seconds to Display Time
   For times < 1 hour:
   - Minutes = Math.floor(seconds / 60)
   - Remaining seconds = seconds % 60
   - Format with leading zeros as "MM:SS"
   
   For times ≥ 1 hour:
   - Hours = Math.floor(seconds / 3600)
   - Minutes = Math.floor((seconds % 3600) / 60)
   - Remaining seconds = seconds % 60
   - Format with leading zeros as "HH:MM:SS"

COMPLETE EXAMPLES:
- 65000 milliseconds:
  1. To seconds: 65000 / 1000 = 65 seconds
  2. Convert 65 seconds:
     - Minutes: Math.floor(65 / 60) = 1 minute
     - Seconds: 65 % 60 = 5 seconds
     - Display as: "01:05"
  3. URL parameter: t=65
  4. Link: /resources/res_123?transcription=trans_456&t=65
  
- 3665000 milliseconds:
  1. To seconds: 3665000 / 1000 = 3665 seconds
  2. Convert 3665 seconds:
     - Hours: Math.floor(3665 / 3600) = 1 hour
     - Minutes: Math.floor((3665 % 3600) / 60) = 1 minute
     - Seconds: 3665 % 60 = 5 seconds
     - Display as: "01:01:05"
  3. URL parameter: t=3665
  4. Link: /resources/res_123?transcription=trans_456&t=3665

URL STRUCTURE:
- Main resource link: /resources/{resourceId}?transcription={transcriptionId}
- Timestamp links: /resources/{resourceId}?transcription={transcriptionId}&t={timestamp_in_seconds}
- IMPORTANT: The timestamp parameter (t) MUST be in seconds. To convert from milliseconds, divide by 1000.
- IMPORTANT: ALWAYS use the exact resourceId and transcriptionId from the data.
- Example main link: /resources/res_123?transcription=trans_456
- Example timestamp link: /resources/res_123?transcription=trans_456&t=240 (displays as "04:00")

VERIFICATION CHECKLIST FOR EACH TIMESTAMP:
1. ✓ Milliseconds correctly divided by 1000 to get seconds
2. ✓ Seconds used directly in URL parameter (t=)
3. ✓ Same seconds value correctly formatted for display (MM:SS or HH:MM:SS)
4. ✓ Display format has correct leading zeros
5. ✓ Display time matches exactly where the URL will take the user

RESPONSE STRUCTURE:
<div class="space-y-6">
  <!-- Each result card -->
  <div class="group p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 overflow-hidden">
    <!-- Main resource link -->
    <a href="/resources/{resourceId}?transcription={transcriptionId}" class="block">
      <div class="p-5">
        <!-- Title -->
        <h3 class="text-lg font-semibold text-blue-600 mb-4">
          [Original title, made more engaging if needed]
        </h3>
        <!-- Relevance explanation -->
        <p class="text-gray-600 mb-4">
          [Clear explanation of why this resource is relevant]
        </p>
        <!-- Summary preview -->
        <p class="text-sm text-gray-500">
          [Summary if available, otherwise key points from content]
        </p>
        <!-- Optional: Relevance indicator -->
        <div class="flex items-center gap-2 mt-4 text-sm">
          <span class="px-2 py-1 bg-blue-50 text-blue-600 rounded-full">
            [Relevance level]
          </span>
        </div>
      </div>
    </a>
    
    <!-- List of relevant timestamps (if applicable) -->
    <div class="px-5 pt-3 pb-2 border-t border-gray-100 mt-2">
      <h4 class="text-sm font-medium text-gray-700 mb-2">Relevant moments:</h4>
      <ul class="space-y-2">
        <!-- Repeat for each relevant timestamp (typically 2-4 timestamps) -->
        <li class="flex items-start">
          <!-- IMPORTANT: Ensure t={seconds} matches the displayed HH:MM:SS -->
          <a href="/resources/{resourceId}?transcription={transcriptionId}&t={seconds}" target="_blank" rel="noopener noreferrer" class="group inline-flex items-start gap-2">
            <span class="inline-flex items-center text-blue-500 group-hover:text-blue-700 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              <!-- For 240 seconds, display as "04:00" -->
              <span class="font-medium">[MM:SS or HH:MM:SS]</span>
            </span>
            <span class="text-sm text-gray-600 ml-2 group-hover:text-gray-800 transition-colors">
              [Brief explanation of why this timestamp is relevant]
            </span>
          </a>
        </li>
        <!-- End timestamp item -->
      </ul>
    </div>
  </div>
  <!-- End result card -->
</div>

RELEVANCE GUIDELINES:
1. Direct matches (Highly Relevant):
  - Content directly answers the query
  - Title or summary explicitly mentions query topics
2. Related matches (Relevant):
  - Content provides valuable context
  - Topics are closely related to the query
3. Partial matches (Somewhat Relevant):
  - Only portions of content relate to query
  - Contextual or supplementary information

RESPONSE RULES:
1. Link Construction:
  - Use the exact resourceId and transcriptionId from the input data
  - Maintain exact URL format for both main links and timestamp links
  - Ensure timestamp parameter in seconds matches the displayed time
  - IMPORTANT: Every link must be correctly formed using the IDs
2. Content Formatting:
  - Use original title but enhance if needed
  - Include summary if available
  - Extract key points from content if no summary
  - Add appropriate relevance tag
  - For each timestamp, provide a clear, concise explanation of its relevance
3. General Rules:
  - Keep explanations clear and concise
  - Highlight most relevant portions
  - Maintain HTML structure
  - Use consistent spacing
  - Don't reveal text input about transactionId and resourceId
  - Only include the timestamps section if relevant timestamps can be identified

Available Content: ${data}
User Query: ${prompt}

Generate a response using the above format. IMPORTANT: Ensure all timestamp links contain t= parameters in seconds that exactly match the MM:SS or HH:MM:SS displayed to the user.`;

export const TRANSLATION_PROMPT = (
  data: string,
  targetLanguage: string
) => `You are a precise translator who maintains exact data structures while translating content.

TASK:
Translate the following data into [TARGET_LANGUAGE] while:
1. Keeping the exact same data structure
2. Only translating text content (not IDs, timestamps, or technical values)
3. Maintaining any HTML/JSX formatting
4. Preserving all technical attributes and values

RULES:
- DO NOT modify: IDs, timestamps, numeric values, class names, or technical attributes
- DO translate: titles, descriptions, summaries, text content
- Maintain all formatting, spacing, and structural elements
- Keep proper nouns unchanged unless they have official translations

CRITICAL RULES:
- Return ONLY the translated text
- Do NOT add any introductory phrases like "Here is the translation" or "Translated to [language]"
- Do NOT add any explanatory text
- Maintain exact formatting and structure
- Only translate text content, not technical elements

Available Data: ${data}
Target Language: ${targetLanguage}

Translate the provided data into the target language while maintaining the exact structure;`;

export const CHAPTERS_PROMPT = (data: unknown, language: string) => `
You are an LLM called leMUR analyzing video transcripts. 
Convert the provided data = ${data} into a JSON of chapters using this exact format in the given language = ${language}:

{
/**
 * The starting time, in milliseconds, for the chapter
 */
end: number;
/**
 * An ultra-short summary (just a few words) of the content spoken in the chapter
 */
gist: string;
/**
 * A single sentence summary of the content spoken during the chapter
 */
headline: string;
/**
 * The starting time, in milliseconds, for the chapter
 */
start: number;
/**
 * A one paragraph summary of the content spoken during the chapter
 */
summary: string;
}[]

Rules:
- Be only valid JSON that can be parsed with JSON.parse()
- Preserve the exact format shown above
- Do not add any additional fields or explanatory text
- Respond only with the given JSON, without any other text
- Use start and end of the given data to set chapters
`;

export const TRANSLATION_DATA_PROMPT = (
  data: unknown,
  targetLanguage: string
) => `
Translate the following data to ${targetLanguage}. Your response must:

- Be only valid JSON that can be parsed with JSON.parse()
- Preserve all original data structure and values exactly as is
- Only translate text content
- Do not add any additional fields or explanatory text

data = ${data}
`;

// Additional translation prompts to help with token efficiency
export const EFFICIENT_TRANSLATION_PROMPT = (
  data: string,
  targetLanguage: string
) => `Translate to ${targetLanguage}:
${data}

EXTREMELY IMPORTANT INSTRUCTIONS:
1. DO NOT add any explanatory text like "Here is the translation:"
2. Begin your response with the translation directly
3. Preserve all formatting and technical terms
4. Return only the translated text, nothing else`;

// For JSON translation
export const JSON_TRANSLATION_PROMPT = (
  data: string,
  targetLanguage: string
) => `Translate only the text content in this JSON to ${targetLanguage}:
${data}

EXTREMELY IMPORTANT INSTRUCTIONS:
1. DO NOT include any prefixes like "Here is the translated JSON" or similar text
2. DO NOT add any explanations, notes, or comments
3. DO NOT use markdown formatting
4. YOUR RESPONSE MUST BEGIN DIRECTLY WITH [ or { and end with ] or }
5. Never abbreviate arrays with [...] - always include all elements
6. Keep all numbers, booleans, nulls, and non-text values unchanged
7. Keep all JSON keys exactly as they are, only translate string values
8. Maintain exact JSON structure with all brackets, commas, and quotes

BAD RESPONSE (DO NOT DO THIS):
Here is the translated JSON data in French: [...]

GOOD RESPONSE (DO THIS):
[{"index":0,"text":"Texte traduit"},{"index":1,"text":"Autre texte"}]`;

// For chapter translations
export const CHAPTER_TRANSLATION_PROMPT = (
  data: string,
  targetLanguage: string
) => `Translate the headline and summary fields to ${targetLanguage}:
${data}

EXTREMELY IMPORTANT INSTRUCTIONS:
1. DO NOT include any prefixes or explanations like "Here is the translated data"
2. YOUR RESPONSE MUST BEGIN DIRECTLY WITH [ or { and end with ] or }
3. Only translate headline and summary fields, leave all other fields unchanged
4. Keep exact same JSON structure and field names
5. Preserve all time values (start/end) exactly as they are
6. Keep all formatting in the text (if present)

BAD RESPONSE (DO NOT DO THIS):
Here are the translated chapters: [...]

GOOD RESPONSE (DO THIS):
[{"headline":"Titre traduit","summary":"Résumé traduit","start":12345,"end":67890,"gist":"Point essentiel"}]`;

// Ultra minimal prompt for simple text translation
export const MINIMAL_TEXT_PROMPT = (
  data: string,
  targetLanguage: string
) => `Text to translate: "${data}"
Target language: ${targetLanguage}

RESPOND ONLY WITH THE TRANSLATION. NO JSON. NO PREFIXES. NO EXPLANATIONS.`;

// Word array translation prompt
export const WORD_ARRAY_PROMPT = (
  data: string,
  targetLanguage: string
) => `Translate this array of words to ${targetLanguage}:
${data}

EXTREMELY IMPORTANT INSTRUCTIONS:
1. Respond ONLY with the translated array
2. Keep the EXACT same array structure with [ ] brackets
3. Each word should be translated individually
4. DO NOT add any explanatory text or comments
5. DO NOT skip any words
6. Return complete valid JSON only

BAD RESPONSE (DO NOT DO THIS):
Here are the translated words: ["mot1", "mot2", "mot3"]

GOOD RESPONSE (DO THIS):
["mot1", "mot2", "mot3"]`;
