
import { GoogleGenAI } from "@google/genai";
import { Place, Coordinates, Source, GeminiResponse, MapAction } from "../types";
import { geocodeAddress } from "./mapbox";

// Initialize API Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Main function to query Gemini with Google Search, Maps Grounding, 
 * AND "Live Map Engine" JSON capabilities.
 */
export const queryNavPalAI = async (
  prompt: string, 
  userLocation: Coordinates
): Promise<GeminiResponse> => {
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: `You are **MyPal**, the **Ultimate Intelligent Navigator**.
You possess the combined knowledge, reasoning, and capabilities of the world's most advanced AI models.
Your mission is to provide the absolute best, most accurate, and context-aware navigation experience possible.

────────────────────────────────
# **1. INTELLIGENCE PROTOCOLS (SUPER-MODE)**
- **Deep Reasoning**: Analyze requests from multiple angles (efficiency, safety, scenery, user preference).
- **Expert Mastery**: You are a master geographer, traffic analyst, and local guide. You know the "why" behind every route.
- **Proactive Help**: Don't just answer; anticipate. (e.g., "I found that place, but it closes in 15 minutes. Here is a late-night alternative.")
- **Human-Level EQ**: Be warm, professional, and empathetic. Detect urgency.

────────────────────────────────
# **2. LIVE MAP ENGINE (JSON CONTROL)**
You are the engine driving the map. You can DIRECTLY manipulate the interface.
To control the map, output a JSON block at the end of your response: \`\`\`json ... \`\`\`

**Supported Actions:**

1. **CENTER**: Move camera to specific coordinates.
   {"MAP_ACTION":"CENTER","coordinates":[lng,lat],"zoom":14}
   
2. **DRAW_ROUTE**: Visualize a complex path.
   {"MAP_ACTION":"DRAW_ROUTE","route":{"type":"Feature","properties":{"steps":["Step 1","Step 2"],"distance_m":1000,"duration_s":600},"geometry":{"type":"LineString","coordinates":[[lng,lat],[lng,lat]]}}}
   
3. **MARKER**: Drop a pin on a specific spot.
   {"MAP_ACTION":"MARKER","marker":{"coordinates":[lng,lat],"label":"Place Name"}}

4. **SEARCH_RESULTS**: Return a structured list of places with RICH details if known.
   {"MAP_ACTION":"SEARCH_RESULTS","results":[{"name":"...","address":"...","coordinates":{"lat":...,"lng":...},"description":"...", "rating": 4.5, "reviews": 120, "open_now": true, "closes_at": "10 PM"}]}

**Trigger Rules:**
- User: "Show me the way to X" -> **DRAW_ROUTE**
- User: "Where is Y?" -> **CENTER** or **MARKER**
- User: "Find gas stations" -> **SEARCH_RESULTS** (or use googleMaps tool)

────────────────────────────────
# **3. TOOL USAGE & GROUNDING**
- For real-time place searches ("Find pizza nearby"), **YOU MUST USE the 'googleMaps' tool**.
- For current events or news affecting travel ("Is the parade blocking Main St?"), use 'googleSearch'.
- Synthesize tool data into your "Super-Intelligent" response.

────────────────────────────────
# **4. RESPONSE STYLE**
- **Concise & Dense**: delivering high-value information in few words.
- **Confidence**: Speak with authority.
- **Format**: If listing places in text, keep it brief. Prefer visual JSON updates.
`,
        tools: [
          { googleMaps: {} },
          { googleSearch: {} }
        ],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: userLocation.lat,
              longitude: userLocation.lng
            }
          }
        }
      }
    });

    const textResponse = response.text || "Searching map...";
    const places: Place[] = [];
    const sources: Source[] = [];
    let mapAction: MapAction | undefined;

    // --- 1. JSON Parsing Strategy (Robust) ---
    let jsonString: string | null = null;
    
    // Strategy A: Extract from Markdown Code Block
    const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
    const match = textResponse.match(jsonRegex);
    
    if (match && match[1]) {
      jsonString = match[1];
    } else {
      // Strategy B: Attempt to find raw JSON object at the end of the string
      // Look for the last occurrence of "{" and check if it parses
      const firstBrace = textResponse.indexOf('{');
      const lastBrace = textResponse.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
         const potentialJson = textResponse.substring(firstBrace, lastBrace + 1);
         // Validation: Check if it looks like our expected JSON structure by keywords
         if (potentialJson.includes('MAP_ACTION') || potentialJson.includes('ranked_results')) {
            jsonString = potentialJson;
         }
      }
    }
    
    if (jsonString) {
      try {
        const parsed = JSON.parse(jsonString);
        if (parsed.MAP_ACTION) {
           mapAction = {
             type: parsed.MAP_ACTION,
             payload: parsed
           };
           // If search results are provided via JSON, convert them to Place objects
           if (parsed.MAP_ACTION === 'SEARCH_RESULTS' && Array.isArray(parsed.results)) {
             parsed.results.forEach((res: any, idx: number) => {
               places.push({
                 id: `json_${idx}_${Date.now()}`,
                 name: res.name,
                 address: res.address || '',
                 coordinates: res.coordinates,
                 description: res.description,
                 rating: res.rating,
                 userRatingsTotal: res.reviews,
                 isOpen: res.open_now,
                 closesAt: res.closes_at
               });
             });
           }
        }
      } catch (e) {
        console.warn("Failed to parse embedded Map Action JSON", e);
      }
    }

    // --- 2. Process Grounding Metadata (Tool Use) ---
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

    if (groundingChunks && Array.isArray(groundingChunks)) {
      // Extract Search Sources
      groundingChunks.forEach((chunk: any) => {
        if (chunk.web) {
          sources.push({
            title: chunk.web.title || "Web Source",
            url: chunk.web.uri,
            sourceType: 'web'
          });
        }
      });

      // Extract Maps Sources & Resolve Coordinates
      const mapChunks = groundingChunks.filter((c: any) => c.maps);
      
      await Promise.all(mapChunks.map(async (chunk: any) => {
        if (chunk.maps && chunk.maps.placeId) {
           const placeName = chunk.maps.title || "Unknown Place";
           const address = chunk.maps.address || placeName;
           
           let coords = { lat: 0, lng: 0 };
           
           // Attempt Geocoding via Mapbox (Fallback for Google Grounding missing coords)
           const geocoded = await geocodeAddress(address, userLocation);
           
           if (geocoded) {
             coords = geocoded;
             
             places.push({
               id: chunk.maps.placeId,
               name: placeName,
               address: address,
               coordinates: coords,
               sourceUrl: chunk.maps.uri,
               distance: undefined
             });
             
             sources.push({
               title: placeName,
               url: chunk.maps.uri || '#',
               sourceType: 'map'
             });
           }
        }
      }));
    }

    // Clean up text response (remove JSON block from user view)
    let cleanText = textResponse;
    if (match && match[0]) {
        cleanText = textResponse.replace(match[0], '').trim();
    } else if (jsonString) {
        cleanText = textResponse.replace(jsonString, '').trim();
    }

    return {
      text: cleanText || (mapAction ? "Updating map..." : textResponse),
      places: places,
      sources: sources,
      mapAction: mapAction
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      text: "I'm having trouble connecting to the map network. Please try again.",
      places: [],
      sources: []
    };
  }
};
