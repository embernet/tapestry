'use strict';
// services/aiRequest.ts: how a provider-neutral AI request (prompt, system
// instruction, Gemini-style schema and function declarations) becomes an OpenAI
// chat completions request, and how the reply is read back.
const test = require('node:test');
const assert = require('node:assert/strict');
const { buildChatCompletionsBody, chatCompletionsEndpoint, readChatCompletion, toJsonSchema, toOpenAIMessages, isOpenAICompatible } = require('../services/aiRequest.ts');
const { Type } = require('../services/aiSchema.ts');

const OBJ = { type: Type.OBJECT, properties: { analysis: { type: Type.STRING }, items: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ['analysis'] };

test('the server provider calls this origin and never sends a key', () => {
  assert.deepEqual(chatCompletionsEndpoint({ provider: 'server', apiKey: 'sk-should-not-go', baseUrl: 'https://api.openai.com/v1' }),
    { url: '/api/ai/v1/chat/completions', headers: { 'Content-Type': 'application/json' } });
  assert.deepEqual(chatCompletionsEndpoint({ provider: 'openai', apiKey: 'sk-own' }),
    { url: 'https://api.openai.com/v1/chat/completions', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sk-own' } });
  assert.equal(chatCompletionsEndpoint({ provider: 'anthropic', apiKey: 'k' }).headers['x-api-key'], 'k');
  assert.equal(isOpenAICompatible('server'), true);
  assert.equal(isOpenAICompatible('gemini'), false);
});

test('Gemini schemas become JSON Schema', () => {
  assert.deepEqual(toJsonSchema({ type: Type.OBJECT, propertyOrdering: ['a'], properties: { a: { type: Type.STRING, nullable: true, enum: ['x'] }, type: { type: Type.INTEGER } } }),
    { type: 'object', properties: { a: { type: ['string', 'null'], enum: ['x'] }, type: { type: 'integer' } } });
});

test('structured output: json_schema for the server, with no schema text in the prompt', () => {
  const { body, wrapped } = buildChatCompletionsBody({ provider: 'server', modelId: 'gpt-5.6', prompt: 'go', systemInstruction: 'sys', responseSchema: OBJ });
  assert.equal(wrapped, false);
  assert.deepEqual(body, {
    model: 'gpt-5.6',
    messages: [{ role: 'system', content: 'sys' }, { role: 'user', content: 'go' }],
    response_format: { type: 'json_schema', json_schema: { name: 'response', schema: toJsonSchema(OBJ), strict: false } },
  });
});

test('structured output: json_object plus the schema in the prompt for other OpenAI-compatible providers', () => {
  const { body } = buildChatCompletionsBody({ provider: 'ollama', modelId: 'llama3', prompt: 'go', responseSchema: OBJ });
  assert.deepEqual(body.response_format, { type: 'json_object' });
  assert.match(body.messages[0].content, /matches this JSON schema/);
});

test('an array schema is wrapped in an object and unwrapped from the reply', () => {
  const arr = { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING } } } };
  const { body, wrapped } = buildChatCompletionsBody({ provider: 'server', modelId: 'm', prompt: 'go', responseSchema: arr });
  assert.equal(wrapped, true);
  assert.deepEqual(body.response_format.json_schema.schema, { type: 'object', properties: { result: toJsonSchema(arr) }, required: ['result'] });
  const reply = { choices: [{ message: { content: JSON.stringify({ result: [{ name: 'a' }] }) } }] };
  assert.deepEqual(JSON.parse(readChatCompletion(reply, true).text), [{ name: 'a' }]);
});

test('function declarations become OpenAI tools; tool calls come back as functionCalls', () => {
  const tools = [{ name: 'updateScript', parameters: { type: Type.OBJECT, properties: { newCode: { type: Type.STRING } }, required: ['newCode'] } }, { name: 'noArgs', description: 'd' }];
  const { body } = buildChatCompletionsBody({ provider: 'server', modelId: 'm', prompt: 'go', tools });
  assert.deepEqual(body.tools, [
    { type: 'function', function: { name: 'updateScript', parameters: { type: 'object', properties: { newCode: { type: 'string' } }, required: ['newCode'] } } },
    { type: 'function', function: { name: 'noArgs', description: 'd', parameters: { type: 'object', properties: {} } } },
  ]);
  const reply = { choices: [{ message: { content: '', tool_calls: [{ id: 'c1', type: 'function', function: { name: 'updateScript', arguments: '{"newCode":"x"}' } }, { id: 'c2', function: { name: 'noArgs', arguments: 'not json' } }] } }] };
  assert.deepEqual(readChatCompletion(reply), { text: '', functionCalls: [{ id: 'c1', name: 'updateScript', args: { newCode: 'x' } }, { id: 'c2', name: 'noArgs', args: {} }] });
  assert.deepEqual(readChatCompletion({ choices: [{ message: { content: 'hi' } }] }), { text: 'hi' });
});

test('Gemini Content maps to messages, including function calls and their results', () => {
  const contents = [
    { role: 'user', parts: [{ text: 'a' }, { text: 'b' }] },
    { role: 'model', parts: [{ text: 'thinking' }, { functionCall: { id: 'f1', name: 'addElement', args: { name: 'X' } } }] },
    { role: 'user', parts: [{ functionResponse: { id: 'f1', name: 'addElement', response: { result: 'ok' } } }, { functionResponse: { id: 'zz', name: 'other', response: { result: 1 } } }] },
    { role: 'model', parts: [{ text: 'done' }] },
  ];
  assert.deepEqual(toOpenAIMessages(contents, 'sys'), [
    { role: 'system', content: 'sys' },
    { role: 'user', content: 'a\nb' },
    { role: 'assistant', content: 'thinking', tool_calls: [{ id: 'f1', type: 'function', function: { name: 'addElement', arguments: '{"name":"X"}' } }] },
    { role: 'tool', tool_call_id: 'f1', content: '{"result":"ok"}' },
    { role: 'user', content: 'Result of other: {"result":1}' },
    { role: 'assistant', content: 'done' },
  ]);
});

test('a refusal is reported, not returned as an empty answer', () => {
  assert.throws(() => readChatCompletion({ choices: [{ message: { content: null, refusal: 'no' } }] }), /declined the request: no/);
});
