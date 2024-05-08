import { NextRequest, NextResponse } from 'next/server';
import { type CoreMessage, StreamingTextResponse, streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
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

export default async function daemon(req: NextRequest) {
  const res = new NextResponse();
  const session = await getIronSession(req, res, ironOptions);
  if (!session.user || !process.env.DAEMON_USERS?.split(',').includes(session.user.id)) {
    return new Response('Forbidden resource', { status: 403 });
  }

  try {
    const { messages, model, temperature, editorRequest } = (await req.json()) as {
      messages: CoreMessage[];
      model?: DaemonModel;
      temperature?: number;
      editorRequest?: string;
    };
    if (!messages) {
      return new Response('Malformed request', { status: 400 });
    }

    const result = await streamText({
      model: openai(model ?? DaemonModel['gpt-3.5-turbo']),
      system: editorRequest ? editorPrompt(editorRequest) : defaultPrompt,
      temperature: temperature ?? 0,
      messages: [...messages],
    });

    return new StreamingTextResponse(result.toAIStream());
  } catch (err) {
    console.error(err);
    return new Response('There was an error processing your request', { status: 500 });
  }
}
