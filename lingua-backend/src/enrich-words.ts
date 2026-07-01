import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

interface WordEntry {
  word: string;
  ipa: string;
  meaning: string;
  example: string;
  exampleMeaning: string;
  level: string;
  topic: string;
  partOfSpeech?: string;
}

/**
 * Enrichment script v3 — Fixed version with:
 * - 15s delay between batches (respects 5 RPM free tier)
 * - Exponential backoff retry (20s → 40s → 60s)
 * - No "Noun" fallback — skips failed words so they can be retried later
 * - Saves progress after each batch
 * - Runs in multiple passes until 100% classified
 */
async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not defined');
  const ai = new GoogleGenAI({ apiKey });

  const jsonPath = path.join(process.cwd(), 'prisma', 'words.json');
  console.log(`📂 Reading from: ${jsonPath}`);
  const words: WordEntry[] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

  const missingWords = words.filter(w => !w.partOfSpeech);
  console.log(`📊 Total: ${words.length} | Classified: ${words.length - missingWords.length} | Remaining: ${missingWords.length}`);

  if (missingWords.length === 0) {
    console.log('✅ All words are fully classified!');
    return;
  }

  const batchSize = 100;
  const totalBatches = Math.ceil(missingWords.length / batchSize);
  console.log(`🚀 Processing ${totalBatches} batches of ${batchSize}...`);
  let successCount = 0;

  for (let i = 0; i < totalBatches; i++) {
    const startIdx = i * batchSize;
    const batch = missingWords.slice(startIdx, startIdx + batchSize);
    console.log(`\n⚡ Batch ${i + 1}/${totalBatches} (${batch.length} words)...`);

    const prompt = `Classify these ${batch.length} English words by their part of speech as used in the example sentence.
IMPORTANT: Only use these 4 categories: "Noun", "Verb", "Adjective", "Adverb".
If a word is a determiner, article, pronoun, preposition, or conjunction, classify it as "Noun" only as a last resort — prefer the category that best matches its usage in the example.

${batch.map((w, idx) => `${idx + 1}. "${w.word}" — "${w.example}"`).join('\n')}

Return a JSON object where keys are the exact words and values are one of: "Noun", "Verb", "Adjective", "Adverb".`;

    let success = false;
    const maxRetries = 3;
    const baseDelay = 65000; // 65s base to clear minute-based 429 quota window

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const responseText = response.text;
        if (!responseText) throw new Error('Empty response');

        const classifications: Record<string, string> = JSON.parse(responseText);
        const validPOS = new Set(['Noun', 'Verb', 'Adjective', 'Adverb']);

        let classified = 0;
        for (const w of batch) {
          const pos = classifications[w.word] || classifications[w.word.toLowerCase()];
          if (pos && validPOS.has(pos)) {
            w.partOfSpeech = pos;
            classified++;
          }
          // If AI didn't return a valid POS, leave partOfSpeech undefined (don't fallback to Noun!)
        }

        fs.writeFileSync(jsonPath, JSON.stringify(words, null, 2), 'utf-8');
        successCount += classified;
        console.log(`  ✅ Classified ${classified}/${batch.length} words (total progress: ${successCount}/${missingWords.length})`);
        success = true;
        break;
      } catch (error: unknown) {
        const delay = baseDelay * attempt; // exponential: 65s, 130s, 195s
        const errMsg = error instanceof Error ? error.message : String(error);
        console.warn(`  ⚠️ Attempt ${attempt}/${maxRetries} failed: ${errMsg.substring(0, 100)}`);
        console.log(`  ⏳ Waiting ${delay / 1000}s before retry...`);
        await new Promise(r => setTimeout(r, delay));
      }
    }

    if (!success) {
      console.error(`  ❌ Batch ${i + 1} failed after ${maxRetries} retries. Skipping (will retry in next run).`);
    }

    // Delay between successful batches to stay under 5 RPM
    if (i < totalBatches - 1) {
      console.log(`  ⏳ Cooling down 20s...`);
      await new Promise(r => setTimeout(r, 20000));
    }
  }

  // Final stats
  const finalMissing = words.filter(w => !w.partOfSpeech).length;
  const stats: Record<string, number> = {};
  words.forEach(w => { if (w.partOfSpeech) stats[w.partOfSpeech] = (stats[w.partOfSpeech] || 0) + 1; });
  
  console.log(`\n📊 Final Results:`);
  console.log(`  Classified: ${words.length - finalMissing}/${words.length}`);
  console.log(`  Still missing: ${finalMissing}`);
  console.log(`  Distribution:`, JSON.stringify(stats));
  
  if (finalMissing > 0) {
    console.log(`\n💡 Run this script again to classify the remaining ${finalMissing} words.`);
  } else {
    console.log(`\n🎉 All words are fully classified!`);
  }
}

main().catch(console.error);
