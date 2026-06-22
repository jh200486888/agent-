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
  // ============ 国内大模型 ============
  // 字节跳动 - 豆包
  { model_id: 'doubao-seed-2-0-pro-260215', display_name: '豆包 Seed 2.0 Pro', provider: 'doubao', description: '旗舰多模态模型，复杂推理能力强', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 1 },
  { model_id: 'doubao-seed-2-0-lite-260215', display_name: '豆包 Seed 2.0 Lite', provider: 'doubao', description: '性能与成本均衡', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 2 },
  { model_id: 'doubao-seed-2-0-mini-260215', display_name: '豆包 Seed 2.0 Mini', provider: 'doubao', description: '低延迟，高吞吐', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 3 },
  
  // 深度求索 - DeepSeek
  { model_id: 'deepseek-chat', display_name: 'DeepSeek Chat', provider: 'deepseek', description: '通用对话模型', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 4 },
  { model_id: 'deepseek-coder', display_name: 'DeepSeek Coder', provider: 'deepseek', description: '代码生成专用模型', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 5 },
  { model_id: 'deepseek-reasoner', display_name: 'DeepSeek Reasoner', provider: 'deepseek', description: '深度推理模型', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 6 },
  
  // 月之暗面 - Kimi
  { model_id: 'moonshot-v1-8k', display_name: 'Kimi 8K', provider: 'kimi', description: '8K上下文窗口', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 7 },
  { model_id: 'moonshot-v1-32k', display_name: 'Kimi 32K', provider: 'kimi', description: '32K上下文窗口', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 8 },
  { model_id: 'moonshot-v1-128k', display_name: 'Kimi 128K', provider: 'kimi', description: '128K超长上下文', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 9 },
  
  // 智谱 - GLM
  { model_id: 'glm-4', display_name: 'GLM-4', provider: 'zhipu', description: '智谱旗舰模型', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 10 },
  { model_id: 'glm-4-air', display_name: 'GLM-4-Air', provider: 'zhipu', description: '高性价比版本', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 11 },
  { model_id: 'glm-4-flash', display_name: 'GLM-4-Flash', provider: 'zhipu', description: '快速响应版本', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 12 },
  
  // 通义千问 - Qwen
  { model_id: 'qwen-turbo', display_name: '通义千问 Turbo', provider: 'qwen', description: '快速响应', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 13 },
  { model_id: 'qwen-plus', display_name: '通义千问 Plus', provider: 'qwen', description: '性能均衡', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 14 },
  { model_id: 'qwen-max', display_name: '通义千问 Max', provider: 'qwen', description: '旗舰模型', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 15 },
  
  // 百度 - 文心一言
  { model_id: 'ernie-bot-4', display_name: '文心一言 4.0', provider: 'baidu', description: '百度旗舰模型', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 16 },
  { model_id: 'ernie-bot-3.5', display_name: '文心一言 3.5', provider: 'baidu', description: '稳定版本', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 17 },
  
  // 讯飞 - 星火
  { model_id: 'spark-v3.5', display_name: '讯飞星火 3.5', provider: 'spark', description: '讯飞旗舰模型', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 18 },
  { model_id: 'spark-v3.0', display_name: '讯飞星火 3.0', provider: 'spark', description: '稳定版本', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 19 },
  
  // MiniMax
  { model_id: 'abab6.5s-chat', display_name: 'MiniMax ABAB 6.5S', provider: 'minimax', description: '旗舰对话模型', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 20 },
  
  // 零一万物 - Yi
  { model_id: 'yi-large', display_name: 'Yi-Large', provider: 'yi', description: '零一万物旗舰模型', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 21 },
  { model_id: 'yi-medium', display_name: 'Yi-Medium', provider: 'yi', description: '均衡版本', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 22 },
  
  // ============ 国外大模型 ============
  // OpenAI
  { model_id: 'gpt-4o', display_name: 'GPT-4o', provider: 'openai', description: 'OpenAI 最新旗舰模型', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 30 },
  { model_id: 'gpt-4o-mini', display_name: 'GPT-4o Mini', provider: 'openai', description: '高性价比版本', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 31 },
  { model_id: 'gpt-4-turbo', display_name: 'GPT-4 Turbo', provider: 'openai', description: 'GPT-4 增强版', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 32 },
  { model_id: 'gpt-3.5-turbo', display_name: 'GPT-3.5 Turbo', provider: 'openai', description: '经典模型，性价比高', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 33 },
  
  // Anthropic - Claude
  { model_id: 'claude-4-opus', display_name: 'Claude 4 Opus', provider: 'anthropic', description: 'Anthropic 最强模型', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 40 },
  { model_id: 'claude-4-sonnet', display_name: 'Claude 4 Sonnet', provider: 'anthropic', description: '性能均衡', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 41 },
  { model_id: 'claude-3-5-sonnet', display_name: 'Claude 3.5 Sonnet', provider: 'anthropic', description: '上一代旗舰', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 42 },
  { model_id: 'claude-3-haiku', display_name: 'Claude 3 Haiku', provider: 'anthropic', description: '快速响应版本', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 43 },
  
  // Google - Gemini
  { model_id: 'gemini-2.5-pro', display_name: 'Gemini 2.5 Pro', provider: 'google', description: 'Google 最新旗舰', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 50 },
  { model_id: 'gemini-2.0-flash', display_name: 'Gemini 2.0 Flash', provider: 'google', description: '快速响应版本', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 51 },
  { model_id: 'gemini-1.5-pro', display_name: 'Gemini 1.5 Pro', provider: 'google', description: '1.5代旗舰', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 52 },
  
  // Meta - Llama
  { model_id: 'llama-3.1-405b', display_name: 'Llama 3.1 405B', provider: 'meta', description: 'Meta 最大开源模型', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 60 },
  { model_id: 'llama-3.1-70b', display_name: 'Llama 3.1 70B', provider: 'meta', description: '性能均衡', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 61 },
  
  // Mistral
  { model_id: 'mistral-large', display_name: 'Mistral Large', provider: 'mistral', description: 'Mistral 旗舰模型', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 70 },
  { model_id: 'mistral-small', display_name: 'Mistral Small', provider: 'mistral', description: '轻量版本', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 71 },
  
  // Cohere
  { model_id: 'command-r-plus', display_name: 'Command R+', provider: 'cohere', description: 'Cohere 旗舰模型', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 80 },
  { model_id: 'command-r', display_name: 'Command R', provider: 'cohere', description: 'RAG优化版本', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 81 },
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
