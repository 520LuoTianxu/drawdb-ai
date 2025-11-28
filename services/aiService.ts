
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateSchema = async (
  userPrompt: string,
  onStreamUpdate?: (chunk: string) => void
): Promise<string> => {
  const systemPrompt = `
    You are a professional database architect.
    Your task is to generate a SQL DDL schema (MySQL dialect) based on the user's description.
    
    Rules:
    1. Output valid SQL 'CREATE TABLE' statements.
    2. WRAP the SQL in a markdown code block, like this:
       \`\`\`sql
       CREATE TABLE ...
       \`\`\`
    3. Include PRIMARY KEY constraints defined inline or at the end of the table.
    4. Include FOREIGN KEY constraints explicitly inside the CREATE TABLE statement.
    5. Add COMMENTs to columns and tables where appropriate to explain the schema.
    6. Use standard types: INT, BIGINT, VARCHAR(n), TEXT, BOOLEAN, DATETIME, DECIMAL(p,s), JSON.
    7. Ensure table names and column names are snake_case.
    8. You may include a brief explanation BEFORE the code block, but the code block must be complete.
    9. If the user description is vague, infer a comprehensive and professional schema structure.
  `;

  try {
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.1,
      }
    });

    let fullText = '';
    
    // Manual async iteration to avoid 'for await' syntax issues in some environments
    const reader = responseStream[Symbol.asyncIterator]();
    while (true) {
        const { value, done } = await reader.next();
        if (done) break;
        
        const text = value.text;
        if (text) {
            fullText += text;
            if (onStreamUpdate) {
                onStreamUpdate(text);
            }
        }
    }
    
    // Extraction Strategy:
    // 1. Try to find the content inside ```sql ... ```
    const codeBlockMatch = fullText.match(/```sql([\s\S]*?)```/i);
    if (codeBlockMatch) {
      return codeBlockMatch[1].trim();
    }
    
    // 2. Fallback: Try to find content inside generic ``` ... ```
    const genericBlockMatch = fullText.match(/```([\s\S]*?)```/i);
    if (genericBlockMatch) {
      return genericBlockMatch[1].trim();
    }

    // 3. Last Resort: Return the full text cleaned of markers
    return fullText.replace(/```sql/gi, '').replace(/```/g, '').trim();

  } catch (error) {
    console.error("AI Generation Error:", error);
    throw new Error("Failed to generate schema from AI.");
  }
};
