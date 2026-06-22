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
  // ============ 国内大模型（2025最新） ============
  // 字节跳动 - 豆包
  { model_id: 'doubao-seed-2-0-pro-260215', display_name: '豆包 Seed 2.0 Pro', provider: 'doubao', description: '旗舰级全能通用模型，复杂推理与长链路任务', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 1 },
  { model_id: 'doubao-seed-2-0-lite-260215', display_name: '豆包 Seed 2.0 Lite', provider: 'doubao', description: '均衡型模型，性能与成本兼顾', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 2 },
  { model_id: 'doubao-seed-2-0-mini-260215', display_name: '豆包 Seed 2.0 Mini', provider: 'doubao', description: '低时延高并发，256K上下文', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 3 },
  
  // 深度求索 - DeepSeek
  { model_id: 'deepseek-v3-2-251201', display_name: 'DeepSeek V3.2', provider: 'deepseek', description: '最新旗舰模型，推理能力与输出长度平衡', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 8192, sort_order: 4 },
  { model_id: 'deepseek-r1-250120', display_name: 'DeepSeek R1', provider: 'deepseek', description: '深度推理模型，复杂问题解决', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 8192, sort_order: 5 },
  
  // 月之暗面 - Kimi
  { model_id: 'kimi-k2-5-260127', display_name: 'Kimi K2.5', provider: 'kimi', description: '迄今最智能模型，原生多模态架构', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 8192, sort_order: 6 },
  
  // 智谱 - GLM
  { model_id: 'glm-5-0-260211', display_name: 'GLM-5.0', provider: 'zhipu', description: '新一代旗舰基座，复杂系统工程', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 7 },
  { model_id: 'glm-5-turbo-260316', display_name: 'GLM-5 Turbo', provider: 'zhipu', description: '深度优化基座模型', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 8 },
  { model_id: 'glm-4-7-251222', display_name: 'GLM-4.7', provider: 'zhipu', description: '更强编程能力与推理', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 9 },
  
  // 通义千问 - Qwen
  { model_id: 'qwen-3-5-plus-260215', display_name: '通义千问 3.5 Plus', provider: 'qwen', description: '原生视觉语言Plus模型，混合架构', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 10 },
  { model_id: 'qwen-3-5-max-260215', display_name: '通义千问 3.5 Max', provider: 'qwen', description: '旗舰模型，最强性能', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 11 },
  
  // 百度 - 文心一言
  { model_id: 'ernie-4-5-turbo', display_name: '文心一言 4.5 Turbo', provider: 'baidu', description: '百度最新旗舰模型', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 12 },
  { model_id: 'ernie-4-5', display_name: '文心一言 4.5', provider: 'baidu', description: '旗舰版本', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 13 },
  
  // 讯飞 - 星火
  { model_id: 'spark-4-0-ultra', display_name: '讯飞星火 4.0 Ultra', provider: 'spark', description: '讯飞最新旗舰模型', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 14 },
  { model_id: 'spark-4-0', display_name: '讯飞星火 4.0', provider: 'spark', description: '4.0版本', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 15 },
  
  // MiniMax
  { model_id: 'minimax-m2-5-260212', display_name: 'MiniMax M2.5', provider: 'minimax', description: '编码与智能体领域SOTA', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 16 },
  { model_id: 'minimax-m2-7-260318', display_name: 'MiniMax M2.7', provider: 'minimax', description: '复杂Agent任务', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 17 },
  
  // 零一万物 - Yi
  { model_id: 'yi-lightning', display_name: 'Yi-Lightning', provider: 'yi', description: '零一万物最新旗舰', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 18 },
  
  // ============ 国外大模型（2025最新） ============
  // OpenAI
  { model_id: 'gpt-4o-2024-11-20', display_name: 'GPT-4o', provider: 'openai', description: 'OpenAI 最新旗舰，多模态', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 30 },
  { model_id: 'gpt-4o-mini-2024-07-18', display_name: 'GPT-4o Mini', provider: 'openai', description: '高性价比版本', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 31 },
  { model_id: 'gpt-4-5-2024-08-06', display_name: 'GPT-4.5', provider: 'openai', description: 'GPT-4.5最新版本', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 32 },
  { model_id: 'o1-2024-12-17', display_name: 'OpenAI o1', provider: 'openai', description: '推理模型，复杂任务', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 8192, sort_order: 33 },
  { model_id: 'o1-mini-2024-09-12', display_name: 'OpenAI o1-mini', provider: 'openai', description: '轻量推理模型', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 8192, sort_order: 34 },
  
  // Anthropic - Claude
  { model_id: 'claude-4-opus-20250514', display_name: 'Claude 4 Opus', provider: 'anthropic', description: 'Anthropic 最强模型', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 8192, sort_order: 40 },
  { model_id: 'claude-4-sonnet-20250514', display_name: 'Claude 4 Sonnet', provider: 'anthropic', description: '性能均衡', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 8192, sort_order: 41 },
  { model_id: 'claude-3-7-sonnet-20250219', display_name: 'Claude 3.7 Sonnet', provider: 'anthropic', description: '3.7代旗舰', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 8192, sort_order: 42 },
  { model_id: 'claude-3-5-sonnet-20241022', display_name: 'Claude 3.5 Sonnet', provider: 'anthropic', description: '上一代旗舰', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 43 },
  { model_id: 'claude-3-5-haiku-20241022', display_name: 'Claude 3.5 Haiku', provider: 'anthropic', description: '快速响应版本', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 44 },
  
  // Google - Gemini
  { model_id: 'gemini-2-5-pro-preview-05-06', display_name: 'Gemini 2.5 Pro', provider: 'google', description: 'Google 最新旗舰', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 8192, sort_order: 50 },
  { model_id: 'gemini-2-0-flash-001', display_name: 'Gemini 2.0 Flash', provider: 'google', description: '快速响应版本', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 8192, sort_order: 51 },
  { model_id: 'gemini-2-0-flash-lite-001', display_name: 'Gemini 2.0 Flash Lite', provider: 'google', description: '轻量版本', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 8192, sort_order: 52 },
  
  // Meta - Llama
  { model_id: 'llama-3-3-70b-instruct', display_name: 'Llama 3.3 70B', provider: 'meta', description: 'Meta 最新开源模型', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 60 },
  { model_id: 'llama-3-1-405b-instruct', display_name: 'Llama 3.1 405B', provider: 'meta', description: '最大开源模型', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 61 },
  
  // Mistral
  { model_id: 'mistral-large-2411', display_name: 'Mistral Large 2', provider: 'mistral', description: 'Mistral 最新旗舰', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 70 },
  { model_id: 'mistral-small-2409', display_name: 'Mistral Small', provider: 'mistral', description: '轻量版本', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 71 },
  
  // Cohere
  { model_id: 'command-r-plus-08-2024', display_name: 'Command R+', provider: 'cohere', description: 'Cohere 旗舰模型', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 80 },
  { model_id: 'command-r-08-2024', display_name: 'Command R', provider: 'cohere', description: 'RAG优化版本', is_enabled: 1, default_temperature: '0.7', default_max_tokens: 4096, sort_order: 81 },
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
