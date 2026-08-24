import { FormEvent, useEffect, useMemo, useState } from "react";
import type { CoreConversation, ConversationMessage } from "@mindanchor/domain";
import { api } from "../api";

export function SingleBrainPage() {
  const [conversations, setConversations] = useState<CoreConversation[]>([]);
  const [selected, setSelected] = useState<CoreConversation | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const result = await api.listCoreConversations();
      setConversations(result.conversations);
      if (!selected && result.conversations[0]) await select(result.conversations[0]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "无法加载会话");
    } finally {
      setLoading(false);
    }
  };

  const select = async (conversation: CoreConversation) => {
    setSelected(conversation);
    try {
      const result = await api.getCoreConversation(conversation.id);
      setMessages(result.messages);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "无法加载消息");
    }
  };

  useEffect(() => { void load(); }, []);

  const create = async () => {
    try {
      const conversation = await api.createCoreConversation({ title: "新的 Single Brain 会话" });
      setConversations((current) => [conversation, ...current]);
      setSelected(conversation);
      setMessages([]);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "无法新建会话"); }
  };

  const archive = async () => {
    if (!selected) return;
    try {
      const conversation = await api.archiveCoreConversation(selected.id);
      setSelected(conversation);
      setConversations((current) => current.map((item) => item.id === conversation.id ? conversation : item));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "无法归档会话"); }
  };

  const remove = async () => {
    if (!selected) return;
    try {
      await api.deleteCoreConversation(selected.id);
      const remaining = conversations.filter((item) => item.id !== selected.id);
      setConversations(remaining); setSelected(remaining[0] ?? null); setMessages([]);
      if (remaining[0]) await select(remaining[0]);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "无法删除会话"); }
  };

  const send = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected || selected.status !== "active" || !draft.trim() || sending) return;
    const content = draft.trim(); setDraft(""); setSending(true); setError(null);
    try {
      const result = await api.sendCoreMessage(selected.id, { content });
      setMessages((current) => [...current, result.userMessage, result.assistantMessage]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "本轮生成失败，可以稍后重试");
    } finally { setSending(false); }
  };

  const status = useMemo(() => selected?.status === "archived" ? "已归档" : "进行中", [selected]);

  return <section className="page single-brain-page">
    <header className="page-header">
      <div><p className="eyebrow">V0.1-B · Single Brain</p><h2>Single Brain</h2><p className="muted">一个温和、连续且尊重边界的对话入口。</p></div>
      <button className="button primary" onClick={() => void create()}>新建会话</button>
    </header>
    {error && <div className="notice error" role="alert">{error}</div>}
    <div className="single-brain-layout">
      <aside className="card session-list"><div className="card-header"><h3>会话</h3><span className="pill">{conversations.length}</span></div>
        {loading ? <p className="muted">正在加载会话…</p> : conversations.length === 0 ? <p className="muted">还没有会话，创建一个新的对话开始吧。</p> : conversations.map((conversation) => <button key={conversation.id} className={`session-item ${selected?.id === conversation.id ? "selected" : ""}`} onClick={() => void select(conversation)}><strong>{conversation.title}</strong><small>{conversation.status === "active" ? "进行中" : "已归档"}</small></button>)}
      </aside>
      <div className="card conversation-panel">
        {selected ? <>
          <div className="card-header"><div><h3>{selected.title}</h3><p className="muted">{status} · 本轮未发送 Life Compass</p></div><div className="inline-actions"><button className="button" disabled={selected.status !== "active"} onClick={() => void archive()}>归档</button><button className="button danger" onClick={() => void remove()}>删除</button></div></div>
          <div className="message-list">{messages.length === 0 ? <p className="muted">从这里开始，告诉我此刻最重要的事情。</p> : messages.map((message) => <article key={message.id} className={`message-bubble ${message.role}`}><span className="message-role">{message.role === "user" ? "你" : message.role === "assistant" ? "Single Brain" : "系统"}</span><p>{message.content}</p>{message.status !== "completed" && <small className="muted">{message.status === "blocked" ? "本轮被安全边界拦截。" : "本轮生成失败，可以重试。"}</small>}</article>)}</div>
          <form className="composer" onSubmit={send}><textarea aria-label="输入消息" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="写下你正在经历的事…" disabled={sending || selected.status !== "active"} /><button className="button primary" type="submit" disabled={sending || !draft.trim() || selected.status !== "active"}>{sending ? "发送中…" : "发送"}</button></form>
        </> : <div className="empty-state"><h3>准备好开始了吗？</h3><p className="muted">创建一个会话，Single Brain 会在这里陪你梳理当下。</p></div>}
      </div>
    </div>
  </section>;
}
