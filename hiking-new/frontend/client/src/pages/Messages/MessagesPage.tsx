import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MessageCircle, Send } from 'lucide-react';
import * as api from '@client/src/api';
import { useAuth } from '@client/src/hooks/use-hiking';
import { toast } from 'sonner';
import Seo from '@client/src/components/Seo';

interface Conversation {
  id: number;
  other_user_id: number;
  other_username: string;
  other_avatar?: string;
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
}

interface Message {
  id: number;
  sender_id: number;
  content: string;
  created_at: string;
  sender_name: string;
}

const MessagesPage = () => {
  const { isLoggedIn, user } = useAuth();
  const [params] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const loadConversations = async (): Promise<void> => {
    if (!isLoggedIn) return;
    const data = await api.listConversations();
    setConversations((data.conversations || []) as unknown as Conversation[]);
    const requested = Number(params.get('to') || 0);
    if (requested) {
      const result = await api.createConversation(requested);
      setActiveId(result.id);
    } else if (!activeId && data.conversations?.[0]) {
      setActiveId(Number(data.conversations[0].id));
    }
  };

  useEffect(() => {
    setLoading(true);
    loadConversations()
      .catch((error) => toast.error(error instanceof Error ? error.message : '会话加载失败'))
      .finally(() => setLoading(false));
  }, [isLoggedIn, params]);

  useEffect(() => {
    if (!activeId) return;
    api.listMessages(activeId)
      .then((data) => setMessages((data.messages || []) as unknown as Message[]))
      .catch(() => {});
    void api.markConversationRead(activeId);
  }, [activeId]);

  if (!isLoggedIn) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <MessageCircle className="mx-auto text-pine-600" size={38} />
        <h1 className="mt-4 font-display text-xl text-ink">登录后查看私信</h1>
        <Link to="/login" className="mt-6 inline-flex rounded-lg bg-pine-700 px-5 py-2.5 text-sm font-semibold text-paper">去登录</Link>
      </div>
    );
  }

  const send = async (): Promise<void> => {
    if (!activeId || !content.trim()) return;
    setSending(true);
    try {
      await api.sendMessage(activeId, content.trim());
      setContent('');
      const data = await api.listMessages(activeId);
      setMessages((data.messages || []) as unknown as Message[]);
      await loadConversations();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '消息发送失败');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
      <Seo title="私信" description="与徒步伙伴进行一对一交流。" path="/messages" />
      <div className="mb-8">
        <p className="text-kicker uppercase text-ember-600">Trail Messages</p>
        <h1 className="mt-2 font-display text-xl text-ink md:text-h1">私信</h1>
      </div>

      {loading ? (
        <p className="py-20 text-center text-sm text-muted-foreground">加载中...</p>
      ) : (
        <div className="grid min-h-[520px] overflow-hidden rounded-xl border border-border bg-card md:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="border-b border-border md:border-b-0 md:border-r">
            {conversations.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">还没有会话，去作者主页发起私信。</p>
            ) : (
              conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => setActiveId(conversation.id)}
                  className={`block w-full border-b border-border px-4 py-3 text-left transition-colors hover:bg-pine-50 ${activeId === conversation.id ? 'bg-pine-50' : ''}`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <strong className="text-sm text-ink">{conversation.other_username}</strong>
                    {conversation.unread_count > 0 && <span className="rounded-full bg-ember-500 px-1.5 text-[10px] text-paper">{conversation.unread_count}</span>}
                  </span>
                  <span className="mt-1 block truncate text-xs text-muted-foreground">{conversation.last_message || '开始聊天'}</span>
                </button>
              ))
            )}
          </aside>
          <section className="flex min-h-[520px] flex-col">
            {activeId ? (
              <>
                <div className="flex-1 space-y-4 overflow-y-auto p-5">
                  {messages.map((message) => {
                    const mine = Number(message.sender_id) === Number(user?.id);
                    return (
                      <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[78%] rounded-xl px-3.5 py-2.5 text-sm ${mine ? 'bg-pine-700 text-paper' : 'bg-muted text-ink'}`}>
                          <p className="whitespace-pre-wrap">{message.content}</p>
                          <p className={`mt-1 font-data text-[10px] ${mine ? 'text-pine-200' : 'text-muted-foreground'}`}>{message.created_at?.slice(0, 16)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-2 border-t border-border p-3">
                  <textarea
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    rows={2}
                    maxLength={2000}
                    placeholder="输入消息..."
                    className="min-h-11 flex-1 resize-none rounded-lg border border-border bg-paper px-3 py-2 text-sm outline-none focus:border-pine-500"
                  />
                  <button type="button" onClick={send} disabled={sending || !content.trim()} className="grid h-11 w-11 place-items-center rounded-lg bg-pine-700 text-paper disabled:opacity-50">
                    <Send size={17} />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">选择一个会话开始聊天</div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default MessagesPage;
