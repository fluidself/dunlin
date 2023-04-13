import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session/edge';
import { ironOptions } from 'constants/iron-session';
import { OpenAIStream, OpenAIStreamPayload, ChatCompletionMessage } from 'utils/openai-stream';

export const config = {
  runtime: 'edge',
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export default async function daemon(req: NextRequest): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const res = new NextResponse();
  const session = await getIronSession(req, res, ironOptions);
  if (!session.user || !process.env.DAEMON_USERS?.split(',').includes(session.user.id)) {
    return new Response('Forbidden resource', { status: 403 });
  }

  try {
    const { messageLog } = (await req.json()) as { messageLog: ChatCompletionMessage[] };
    if (!messageLog) {
      return new Response('Malformed request', { status: 400 });
    }

    const messages: ChatCompletionMessage[] = [
      {
        role: 'system',
        content:
          'You are a helpful, succinct assistant. You always format your output in markdown and include code snippets and tables if relevant.',
      },
      ...messageLog.map(msg =>
        msg.role === 'user' ? { ...msg, content: msg.content.trim().replace(/\n/g, ' ') } : msg,
      ),
    ];

    const payload: OpenAIStreamPayload = {
      model: 'gpt-3.5-turbo-0301',
      messages: messages,
      temperature: 1,
      max_tokens: 1000,
      stream: true,
      n: 1,
    };

    const stream = await OpenAIStream(payload);
    return new Response(stream);
  } catch (err) {
    console.error(err);
    return new Response('There was an error processing your request', { status: 500 });
  }
}
