
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";

// Audio Configuration
const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;
const BUFFER_SIZE = 4096;

export class LiveAudioService {
  private ai: GoogleGenAI;
  private inputContext: AudioContext | null = null;
  private outputContext: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private outputNode: GainNode | null = null;
  private nextStartTime: number = 0;
  private sources: Set<AudioBufferSourceNode> = new Set();
  private sessionPromise: Promise<any> | null = null;
  private isConnected: boolean = false;

  // Callbacks for UI updates
  public onAudioLevel: ((level: number) => void) | null = null;
  public onDisconnect: (() => void) | null = null;
  public onStateChange: ((state: 'idle' | 'listening' | 'thinking' | 'speaking') => void) | null = null;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async connect() {
    if (this.isConnected) return;

    // Initialize Audio Contexts with Resume Check
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    
    this.inputContext = new AudioCtx({ sampleRate: INPUT_SAMPLE_RATE });
    this.outputContext = new AudioCtx({ sampleRate: OUTPUT_SAMPLE_RATE });

    // Ensure contexts are running (browser autoplay policy)
    if (this.inputContext.state === 'suspended') await this.inputContext.resume();
    if (this.outputContext.state === 'suspended') await this.outputContext.resume();

    this.outputNode = this.outputContext.createGain();
    this.outputNode.connect(this.outputContext.destination);

    // Get Microphone Stream
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
       console.error("Microphone permission denied", err);
       alert("Microphone access is required to talk to MyPal.");
       throw err;
    }

    // Establish Gemini Live Connection
    this.sessionPromise = this.ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
        },
        systemInstruction: `You are **MyPal**, the **Ultimate Intelligent Navigator**.
You speak with the confidence, warmth, and intelligence of a super-human assistant.

# VOICE BEHAVIOR:
- **Concise & Dense**: Spoken answers must be short but packed with high-value info. Do not ramble.
- **Context Aware**: If I am driving, keep it brief. If I am exploring, be descriptive.
- **Emotional EQ**: Detect urgency in the user's voice.
- **Expertise**: You know everything about maps, traffic, and locations.

BEHAVIOR:
- If the user says "Hey MyPal", acknowledge them immediately with a short, friendly chime or word.
- When suggesting a place, mention *why* it's the best (e.g. "Highest rated," "Less traffic").
- Navigate like a local expert.`,
      },
      callbacks: {
        onopen: this.handleOpen.bind(this),
        onmessage: this.handleMessage.bind(this),
        onclose: this.handleClose.bind(this),
        onerror: (err) => {
          console.error("Live API Error:", err);
          this.disconnect();
        },
      },
    });

    this.isConnected = true;
    this.notifyState('listening');
  }

  private handleOpen() {
    console.log("Live Session Opened");
    if (!this.inputContext || !this.stream) return;

    const source = this.inputContext.createMediaStreamSource(this.stream);
    this.scriptProcessor = this.inputContext.createScriptProcessor(BUFFER_SIZE, 1, 1);

    this.scriptProcessor.onaudioprocess = (e) => {
      if (!this.isConnected) return;
      // Safety check for channels
      if (e.inputBuffer.numberOfChannels === 0) return;
      
      const inputData = e.inputBuffer.getChannelData(0);
      
      // Simple visualizer calculation
      let sum = 0;
      for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
      if (this.onAudioLevel) this.onAudioLevel(Math.sqrt(sum / inputData.length));

      // Convert to PCM and Send
      const pcmBlob = this.createPcmBlob(inputData);
      this.sessionPromise?.then((session) => {
        session.sendRealtimeInput({ media: pcmBlob });
      });
    };

    source.connect(this.scriptProcessor);
    this.scriptProcessor.connect(this.inputContext.destination);
    this.notifyState('listening');
  }

  private async handleMessage(message: LiveServerMessage) {
    const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;

    if (base64Audio && this.outputContext && this.outputNode && this.outputContext.state !== 'closed') {
      // Handle Audio Playback logic
      this.notifyState('speaking');
      this.nextStartTime = Math.max(this.nextStartTime, this.outputContext.currentTime);
      
      const audioBuffer = await this.decodeAudioData(
        this.decodeBase64(base64Audio),
        this.outputContext
      );

      const source = this.outputContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.outputNode);
      
      source.addEventListener('ended', () => {
        this.sources.delete(source);
        if (this.sources.size === 0) {
          this.notifyState('listening');
        }
      });

      source.start(this.nextStartTime);
      this.nextStartTime += audioBuffer.duration;
      this.sources.add(source);
    }

    // Handle Interruptions
    if (message.serverContent?.interrupted) {
      this.stopAllAudio();
      this.notifyState('listening');
    }
  }

  private handleClose() {
    console.log("Live Session Closed");
    this.disconnect();
  }

  disconnect() {
    if (!this.isConnected) return;
    this.isConnected = false;
    
    // Stop Mic Tracks
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    // Disconnect Script Processor
    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor.onaudioprocess = null;
      this.scriptProcessor = null;
    }
    
    // Close Contexts safely (Prevent 'close on closed context' error)
    if (this.inputContext && this.inputContext.state !== 'closed') {
      this.inputContext.close().catch(e => console.warn("Input context close error", e));
    }
    if (this.outputContext && this.outputContext.state !== 'closed') {
      this.outputContext.close().catch(e => console.warn("Output context close error", e));
    }
    
    // Reset State
    this.stopAllAudio();
    this.sessionPromise = null;
    
    this.notifyState('idle');
    if (this.onDisconnect) this.onDisconnect();
  }

  private stopAllAudio() {
    this.sources.forEach(source => {
      try { source.stop(); } catch(e) {}
    });
    this.sources.clear();
    this.nextStartTime = 0;
  }

  private notifyState(state: 'idle' | 'listening' | 'thinking' | 'speaking') {
    if (this.onStateChange) {
      this.onStateChange(state);
    }
  }

  // --- Helpers ---

  private createPcmBlob(data: Float32Array): { data: string, mimeType: string } {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = Math.max(-1, Math.min(1, data[i])) * 32767; // Clamp and scale
    }
    // Convert ArrayBuffer to Base64 manually
    let binary = '';
    const bytes = new Uint8Array(int16.buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    
    return {
      data: btoa(binary),
      mimeType: 'audio/pcm;rate=' + INPUT_SAMPLE_RATE,
    };
  }

  private decodeBase64(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  private async decodeAudioData(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length;
    const buffer = ctx.createBuffer(1, frameCount, OUTPUT_SAMPLE_RATE);
    const channelData = buffer.getChannelData(0);
    
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i] / 32768.0;
    }
    return buffer;
  }
}
