import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session/edge';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { SystemChatMessage, HumanChatMessage, AIChatMessage } from 'langchain/schema';
import { CallbackManager } from 'langchain/callbacks';
import type { DaemonMessage } from 'lib/createDaemonSlice';
import { ironOptions } from 'constants/iron-session';

export const config = {
  runtime: 'edge',
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export default async function daemon(req: NextRequest) {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const res = new NextResponse();
  const session = await getIronSession(req, res, ironOptions);
  if (!session.user || !process.env.DAEMON_USERS?.split(',').includes(session.user.id)) {
    return new Response('Forbidden resource', { status: 403 });
  }

  try {
    const { messages, temperature, maxTokens } = (await req.json()) as {
      messages: DaemonMessage[];
      temperature: number;
      maxTokens: number;
    };
    if (!messages || typeof temperature === 'undefined' || !maxTokens) {
      return new Response('Malformed request', { status: 400 });
    }

    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const llm = new ChatOpenAI({
      modelName: 'gpt-3.5-turbo-0301',
      streaming: true,
      temperature,
      maxTokens,
      callbackManager: CallbackManager.fromHandlers({
        async handleLLMNewToken(token) {
          await writer.ready;
          const data = JSON.stringify({ token: token });
          await writer.write(encoder.encode(`data: ${data}\n\n`));
        },
        async handleLLMEnd() {
          await writer.ready;
          await writer.close();
        },
        async handleLLMError(error) {
          await writer.ready;
          await writer.abort(error);
        },
      }),
    });

    llm.call([
      new SystemChatMessage(
        'You are a helpful, succinct assistant. You always format your output in markdown and include code snippets and tables if relevant.',
      ),
      ...messages.map(msg =>
        msg.type === 'human' ? new HumanChatMessage(msg.text.trim().replace(/\n/g, ' ')) : new AIChatMessage(msg.text),
      ),
    ]);

    return new NextResponse(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
      },
    });
  } catch (err) {
    console.error(err);
    return new Response('There was an error processing your request', { status: 500 });
  }
}
