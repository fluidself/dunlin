import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session/edge';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { SystemChatMessage, HumanChatMessage, AIChatMessage } from 'langchain/schema';
import { CallbackManager } from 'langchain/callbacks';
import { type DaemonMessage } from 'lib/createDaemonSlice';
import { DaemonModel } from 'lib/store';
import { ironOptions } from 'constants/iron-session';

export const config = {
  runtime: 'edge',
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const defaultPrompt =
  'You are a helpful, succinct assistant. You always format your output in markdown and include code snippets and tables if relevant.';

const editorPrompt = (request: string) =>
  `You are a helpful assistant.
- Respond as succinctly as possible. Do not offer any explanations or reasoning.
- Return answer in markdown format.
- You are tasked with the following: ${request}`;

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
    const { messages, model, temperature, editorRequest } = (await req.json()) as {
      messages: DaemonMessage[];
      model?: DaemonModel;
      temperature?: number;
      editorRequest?: string;
    };
    if (!messages) {
      return new Response('Malformed request', { status: 400 });
    }

    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const llm = new ChatOpenAI({
      modelName: model ?? DaemonModel['gpt-3.5-turbo'],
      streaming: true,
      temperature: temperature ?? 0,
      maxTokens: -1,
      callbacks: CallbackManager.fromHandlers({
        async handleLLMNewToken(token) {
          await writer.ready;
          const data = JSON.stringify({ token: token });
          await writer.write(encoder.encode(`data: ${data}\n\n`));
        },
        async handleLLMError(error) {
          await writer.ready;
          await writer.abort(error);
        },
        async handleLLMEnd() {
          await writer.ready;
          await writer.close();
        },
      }),
    });

    llm.call([
      new SystemChatMessage(editorRequest ? editorPrompt(editorRequest) : defaultPrompt),
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
