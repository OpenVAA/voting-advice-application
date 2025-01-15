import { json } from '@sveltejs/kit';
import { OpenAIProvider, Role } from '@openvaa/llm';
import { OPENAI_API_KEY } from '$env/static/private';

export async function GET() {
  const res = await new OpenAIProvider({ apiKey: OPENAI_API_KEY })
    .generate([
      {
        role: Role.SYSTEM,
        content: 'message.content'
      },
      {
        role: Role.USER,
        content: 'Can you respond with "Hello, world!"?'
      }
    ])
    .then((r) => r);

  return json({ res });
}
