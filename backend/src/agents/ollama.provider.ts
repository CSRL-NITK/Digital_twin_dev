export class OllamaProvider {
  private endpoint: string;
  private model: string;

  constructor(model: string = 'qwen2.5:1.5b') {
    this.endpoint = process.env.OLLAMA_URL || 'http://localhost:11434';
    this.model = model;
  }

  async generateChat(systemPrompt: string, userMessage: string): Promise<string> {
    try {
      const response = await fetch(`${this.endpoint}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as any;
      return data.message.content.trim();
    } catch (error: any) {
      console.error('Ollama communication error:', error.message);
      throw new Error(`Failed to communicate with offline LLM at ${this.endpoint}. Make sure Ollama is running and qwen2.5:1.5b is pulled.`);
    }
  }
}
