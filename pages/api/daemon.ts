import { NextRequest, NextResponse } from 'next/server';
import { type ChatCompletionRequestMessage, Configuration, OpenAIApi } from 'openai-edge';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { getIronSession } from 'iron-session/edge';
import { ironOptions } from 'constants/iron-session';
import { DaemonModel } from 'lib/store';

export const runtime = 'edge';

const defaultPrompt =
  'You are a helpful, succinct assistant. You always format your output in markdown and include code snippets and tables if relevant.';

const editorPrompt = (request: string) =>
  `You are a helpful assistant.
- Respond as succinctly as possible. Do not offer any explanations or reasoning.
- Return answer in markdown format.
- You are tasked with the following: ${request}`;

const config = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
const openai = new OpenAIApi(config);

export default async function daemon(req: NextRequest) {
  const res = new NextResponse();
  const session = await getIronSession(req, res, ironOptions);
  if (!session.user || !process.env.DAEMON_USERS?.split(',').includes(session.user.id)) {
    return new Response('Forbidden resource', { status: 403 });
  }

  try {
    const { messages, model, temperature, editorRequest } = (await req.json()) as {
      messages: ChatCompletionRequestMessage[];
      model?: DaemonModel;
      temperature?: number;
      editorRequest?: string;
    };
    if (!messages) {
      return new Response('Malformed request', { status: 400 });
    }

    const response = await openai.createChatCompletion({
      model: model ?? DaemonModel['gpt-3.5-turbo'],
      temperature: temperature ?? 0,
      messages: [{ role: 'system', content: editorRequest ? editorPrompt(editorRequest) : defaultPrompt }, ...messages],
      stream: true,
    });
    const stream = OpenAIStream(response);
    return new StreamingTextResponse(stream);
  } catch (err) {
    console.error(err);
    return new Response('There was an error processing your request', { status: 500 });
  }
}
