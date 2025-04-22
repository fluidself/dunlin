import { NextRequest, NextResponse } from 'next/server';
import { type CoreMessage, createDataStreamResponse, generateText, streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { getIronSession } from 'iron-session/edge';
import { ironOptions } from 'constants/iron-session';
import { DaemonModel } from 'lib/store';

export const runtime = 'edge';

const defaultPrompt = 'You are a helpful, succinct assistant.';
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

  const { messages, model, temperature, editorRequest } = (await req.json()) as {
    messages: CoreMessage[];
    model?: DaemonModel;
    temperature?: number;
    editorRequest?: string;
  };
  if (!messages) {
    return new Response('Malformed request', { status: 400 });
  }

  try {
    const title = messages.length === 1 && !editorRequest ? await generateTitleFromUserMessage(messages[0]) : null;

    return createDataStreamResponse({
      execute: dataStream => {
        if (title) {
          dataStream.writeData(title);
        }

        const result = streamText({
          model: getModel(model ?? DaemonModel['gemini-2.0-flash']),
          system: editorRequest ? editorPrompt(editorRequest) : defaultPrompt,
          temperature: temperature ?? 0,
          messages,
        });

        result.mergeIntoDataStream(dataStream);
      },
    });
  } catch (err) {
    console.error(err);
    return new Response('There was an error processing your request', { status: 500 });
  }
}

function getModel(daemonModel: DaemonModel) {
  if (daemonModel.startsWith('claude')) {
    return anthropic(daemonModel);
  }
  if (daemonModel.startsWith('gemini')) {
    return google(daemonModel);
  }

  return openai(daemonModel);
}

async function generateTitleFromUserMessage(message: CoreMessage) {
  const { text: title } = await generateText({
    model: google('gemini-2.0-flash'),
    system: `\n
    - you will generate a short title based on the first message a user begins a conversation with
    - ensure it is not more than 80 characters long
    - the title should be a summary of the user's message
    - do not use quotes, colons, or newlines`,
    prompt: JSON.stringify(message),
  });

  return title.replace(/\n/g, '').trim();
}
