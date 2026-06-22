import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { Conversation, Message, ModelConfig, ApiKey } from '@/lib/types';

// ============ Conversations ============

export async function listConversations(): Promise<Conversation[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('conversations')
    .select('id, title, model_id, created_at, updated_at')
    .order('updated_at', { ascending: false })
    .limit(100);
  if (error) throw new Error(`Failed to list conversations: ${error.message}`);
  return (data as Conversation[]) || [];
}

export async function getConversation(id: string): Promise<Conversation | null> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('conversations')
    .select('id, title, model_id, created_at, updated_at')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`Failed to get conversation: ${error.message}`);
  return data as Conversation | null;
}

export async function createConversation(
  title: string,
  modelId: string
): Promise<Conversation> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('conversations')
    .insert({ title, model_id: modelId })
    .select()
    .single();
  if (error) throw new Error(`Failed to create conversation: ${error.message}`);
  return data as Conversation;
}

export async function updateConversation(
  id: string,
  updates: { title?: string; model_id?: string }
): Promise<Conversation> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('conversations')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(`Failed to update conversation: ${error.message}`);
  return data as Conversation;
}

export async function deleteConversation(id: string): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client.from('conversations').delete().eq('id', id);
  if (error) throw new Error(`Failed to delete conversation: ${error.message}`);
}

// ============ Messages ============

export async function listMessages(conversationId: string): Promise<Message[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('messages')
    .select('id, conversation_id, role, content, model_id, token_count, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(200);
  if (error) throw new Error(`Failed to list messages: ${error.message}`);
  return (data as Message[]) || [];
}

export async function createMessage(
  conversationId: string,
  role: string,
  content: string,
  modelId?: string
): Promise<Message> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('messages')
    .insert({
      conversation_id: conversationId,
      role,
      content,
      model_id: modelId || null,
    })
    .select()
    .single();
  if (error) throw new Error(`Failed to create message: ${error.message}`);
  return data as Message;
}

// ============ Model Configs ============

export async function listModelConfigs(): Promise<ModelConfig[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('model_configs')
    .select('*')
    .order('sort_order', { ascending: true })
    .limit(100);
  if (error) throw new Error(`Failed to list model configs: ${error.message}`);
  return (data as ModelConfig[]) || [];
}

export async function upsertModelConfig(config: Partial<ModelConfig> & { model_id: string; display_name: string; provider: string }): Promise<ModelConfig> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('model_configs')
    .upsert(
      { ...config, updated_at: new Date().toISOString() },
      { onConflict: 'model_id' }
    )
    .select()
    .single();
  if (error) throw new Error(`Failed to upsert model config: ${error.message}`);
  return data as ModelConfig;
}

export async function deleteModelConfig(id: string): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client.from('model_configs').delete().eq('id', id);
  if (error) throw new Error(`Failed to delete model config: ${error.message}`);
}

// ============ API Keys ============

export async function listApiKeys(): Promise<ApiKey[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('api_keys')
    .select('*')
    .order('provider', { ascending: true })
    .limit(50);
  if (error) throw new Error(`Failed to list API keys: ${error.message}`);
  return (data as ApiKey[]) || [];
}

export async function getApiKey(provider: string): Promise<ApiKey | null> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('api_keys')
    .select('*')
    .eq('provider', provider)
    .maybeSingle();
  if (error) throw new Error(`Failed to get API key: ${error.message}`);
  return data as ApiKey | null;
}

export async function upsertApiKey(input: {
  provider: string;
  provider_name: string;
  api_key_encrypted: string;
  base_url?: string;
  is_active?: boolean;
}): Promise<ApiKey> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('api_keys')
    .upsert(
      {
        provider: input.provider,
        provider_name: input.provider_name,
        api_key_encrypted: input.api_key_encrypted,
        base_url: input.base_url || null,
        is_active: input.is_active !== false ? 1 : 0,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'provider' }
    )
    .select()
    .single();
  if (error) throw new Error(`Failed to upsert API key: ${error.message}`);
  return data as ApiKey;
}

export async function deleteApiKey(id: string): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client.from('api_keys').delete().eq('id', id);
  if (error) throw new Error(`Failed to delete API key: ${error.message}`);
}

// ============ Seed default models ============

const DEFAULT_MODELS = [
  { model_id: 'doubao-seed-2-0-pro-260215', display_name: 'Doubao Seed 2.0 Pro', provider: 'coze', description: 'Flagship multimodal model for complex reasoning', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 1 },
  { model_id: 'doubao-seed-2-0-lite-260215', display_name: 'Doubao Seed 2.0 Lite', provider: 'coze', description: 'Balanced performance and cost', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 2 },
  { model_id: 'doubao-seed-2-0-mini-260215', display_name: 'Doubao Seed 2.0 Mini', provider: 'coze', description: 'Low latency, high throughput', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 3 },
  { model_id: 'deepseek-v3-2-251201', display_name: 'DeepSeek V3.2', provider: 'coze', description: 'Balanced reasoning and output length', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 4 },
  { model_id: 'kimi-k2-5-260127', display_name: 'Kimi K2.5', provider: 'coze', description: 'Most capable Kimi model with native multimodal', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 5 },
  { model_id: 'glm-5-0-260211', display_name: 'GLM 5.0', provider: 'coze', description: 'Zhipu flagship for agentic engineering', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 6 },
  { model_id: 'minimax-m2-5-260212', display_name: 'MiniMax M2.5', provider: 'coze', description: 'SOTA in coding and agent tasks', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 7 },
  { model_id: 'qwen-3-5-plus-260215', display_name: 'Qwen 3.5 Plus', provider: 'coze', description: 'Native vision-language model', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 8 },
];

export async function seedDefaultModels(): Promise<void> {
  const client = getSupabaseClient();
  const { data: existing } = await client
    .from('model_configs')
    .select('id')
    .limit(1);

  if (existing && existing.length > 0) return;

  const { error } = await client.from('model_configs').insert(
    DEFAULT_MODELS.map((m) => ({
      ...m,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))
  );
  if (error) throw new Error(`Failed to seed default models: ${error.message}`);
}
