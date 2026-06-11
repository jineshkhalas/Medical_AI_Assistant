import { useState, useEffect, useRef, useMemo } from 'react'
import { supabase } from './supabaseClient'
import './App.css'

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);
const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
);
const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
);
const MenuIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
);
const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);
const BotIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path><line x1="12" y1="10" x2="12" y2="16"></line><line x1="9" y1="13" x2="15" y2="13"></line></svg>
);
const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
);
const ProfileIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
);
const LogoutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
);

function renderMarkdown(text) {
  if (!text) return '';
  
  // Escape HTML to prevent XSS
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Convert Bold (**text** or __text__)
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');

  // Convert Italic (*text* or _text_)
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');

  // Convert Headings (### text)
  html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');

  // Convert Bullet points (starting with * or - or •)
  html = html.replace(/^\s*[\*\-\u2022]\s+(.*?)$/gm, '<li>$1</li>');

  // Wrap list items in <ul>. Clean up consecutive lists.
  html = html.replace(/((?:<li>.*?<\/li>\s*)+)/g, '<ul>$1</ul>');

  // Convert newlines to paragraphs / line breaks
  html = html.replace(/\n/g, '<br />');

  // Clean up empty lines or double breaks inside list wraps
  html = html.replace(/<br \/>\s*(<\/li>|<li>|<ul>|<\/ul>)/g, '$1');
  html = html.replace(/(<\/li>|<li>|<ul>|<\/ul>)\s*<br \/>/g, '$1');

  return html;
}

const MEDICAL_SUGGESTIONS = [
  { title: "Diabetes Symptoms", desc: "Common warning signs of high blood sugar.", query: "What are the primary symptoms and diagnostic tests for Type 2 Diabetes?" },
  { title: "Lisinopril Side Effects", desc: "Warnings and drug interactions for this blood pressure drug.", query: "Explain the side effects and drug interactions of Lisinopril." },
  { title: "Common Cold Care", desc: "Home care remedies and recovery guidelines.", query: "What is the standard recommended treatment and recovery time for a common cold?" },
  { title: "Hypertension Diet", desc: "Food guidelines to manage high blood pressure.", query: "What is the DASH diet and how does it help manage hypertension?" },
  { title: "Migraine Triggers", desc: "Identify and avoid common headache triggers.", query: "What are the most common triggers for migraines and how can they be prevented?" },
  { title: "PCOS Management", desc: "Lifestyle and medical options for managing PCOS.", query: "What are the lifestyle changes and medical treatments recommended for PCOS?" },
  { title: "Thyroid Signs", desc: "Signs of underactive or overactive thyroid.", query: "What is the difference between hypothyroidism and hyperthyroidism symptoms?" },
  { title: "Vitamin D Deficiency", desc: "Symptoms and sources of Vitamin D.", query: "What are the symptoms of Vitamin D deficiency and how is it treated?" },
  { title: "GERD Remedies", desc: "Manage chronic acid reflux effectively.", query: "What lifestyle modifications help reduce GERD and acid reflux symptoms?" },
  { title: "Asthma Prevention", desc: "How to avoid asthma flares and use inhalers.", query: "What are the best strategies to prevent asthma attacks and manage triggers?" },
  { title: "Anemia Symptoms", desc: "Signs of low iron and dietary fixes.", query: "What are the main symptoms of iron-deficiency anemia and what foods help?" },
  { title: "Cholesterol Basics", desc: "Understanding HDL vs LDL cholesterol.", query: "What is the difference between HDL and LDL cholesterol and how do I lower LDL?" },
  { title: "Appendicitis Signs", desc: "Recognize the emergency signs of appendicitis.", query: "What are the early warning signs of appendicitis and when should I go to the ER?" },
  { title: "Metformin Guide", desc: "How this common diabetes drug works.", query: "How does Metformin help manage Type 2 Diabetes and what are its side effects?" },
  { title: "Antibiotic Resistance", desc: "Why taking antibiotics correctly is vital.", query: "What is antibiotic resistance and why is it important to complete the prescribed course?" },
  { title: "Gout Diet", desc: "Foods to avoid to prevent painful gout flares.", query: "What foods and drinks trigger gout attacks and what is a gout-friendly diet?" },
  { title: "Sleep Apnea Signs", desc: "Symptoms of sleep apnea and health risks.", query: "What are the symptoms of obstructive sleep apnea and how is it diagnosed?" },
  { title: "Celiac Disease", desc: "Signs of gluten intolerance and celiac.", query: "What is Celiac disease, what are the symptoms, and how is it diagnosed?" },
  { title: "IBS Management", desc: "Dietary tips to soothe irritable bowel syndrome.", query: "What are the best dietary and lifestyle strategies to manage IBS symptoms?" },
  { title: "Kidney Stones", desc: "Symptoms and ways to prevent kidney stones.", query: "What causes kidney stones, what do they feel like, and how can I prevent them?" },
  { title: "Osteoporosis Prevention", desc: "How to build and preserve bone strength.", query: "What are the best ways to prevent osteoporosis and maintain bone density?" },
  { title: "Flu vs. Cold", desc: "Learn to tell the difference.", query: "How can I tell the difference between influenza (the flu) and a common cold?" },
  { title: "Allergy Relief", desc: "Managing seasonal pollen allergies.", query: "What are the most effective treatments and precautions for seasonal allergies?" },
  { title: "Fibromyalgia", desc: "Understanding chronic pain and fatigue.", query: "What is fibromyalgia, what are its symptoms, and how is it managed?" },
  { title: "Statins Guide", desc: "Benefits and side effects of cholesterol drugs.", query: "How do statins lower cholesterol and what are their common side effects?" },
  { title: "Eczema Care", desc: "Moisturizing and soothing dry, itchy skin.", query: "What are the main triggers for eczema flares and how is it treated?" },
  { title: "Rheumatoid Arthritis", desc: "Symptoms of autoimmune joint inflammation.", query: "What is rheumatoid arthritis and how does it differ from osteoarthritis?" },
  { title: "Insomnia Remedies", desc: "Tips for falling and staying asleep.", query: "What is good sleep hygiene and what are natural ways to treat insomnia?" },
  { title: "Gallstones Symptoms", desc: "Signs of gallbladder issues.", query: "What are the symptoms of gallstones and what treatments are available?" },
  { title: "Stroke Warning Signs", desc: "F.A.S.T. warning signs of a stroke.", query: "What are the F.A.S.T. warning signs of a stroke and what should I do?" },
  { title: "Dehydration Signs", desc: "Symptoms of severe fluid loss.", query: "What are the signs of mild vs severe dehydration and how is it treated?" },
  { title: "Chronic Fatigue", desc: "Dealing with constant tiredness.", query: "What are the potential causes of chronic fatigue and when should I see a doctor?" },
  { title: "Shingles Vaccine", desc: "Prevention and symptoms of shingles.", query: "What is shingles, who should get the shingles vaccine, and what are the symptoms?" },
  { title: "Prediabetes Steps", desc: "Reverse prediabetes before it progresses.", query: "What lifestyle changes can help reverse prediabetes and lower blood sugar?" },
  { title: "Aspirin Therapy", desc: "Pros and cons of daily low-dose aspirin.", query: "What are the benefits and risks of daily low-dose aspirin therapy for heart health?" }
];

const getDailySuggestions = () => {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  
  const random = (s) => {
    const x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  };

  const list = [...MEDICAL_SUGGESTIONS];
  const selected = [];
  
  let currentSeed = seed;
  while (selected.length < 3 && list.length > 0) {
    const randVal = random(currentSeed);
    const index = Math.floor(randVal * list.length);
    selected.push(list[index]);
    list.splice(index, 1);
    currentSeed += 1;
  }
  return selected;
};

function App() {
  const [session, setSession] = useState(null);
  const suggestions = useMemo(() => getDailySuggestions(), []);
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [authError, setAuthError] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(() => sessionStorage.getItem('currentChatId'));
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [showProfile, setShowProfile] = useState(false);

  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [settingsStatus, setSettingsStatus] = useState({ type: '', message: '' });

  const chatEndRef = useRef(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        setNewName(session.user.user_metadata.full_name || '');
        setNewEmail(session.user.email);
        fetchChats(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setNewName(session.user.user_metadata.full_name || '');
        setNewEmail(session.user.email);
        fetchChats(session.user.id);
      } else {
        sessionStorage.removeItem('currentChatId');
        setChatHistory([]);
        setMessages([]);
        setCurrentChatId(null);
      }
    });

    const handleResize = () => {
      if (window.innerWidth <= 768) setIsSidebarOpen(false);
      else setIsSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      subscription.unsubscribe();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const fetchChats = async (userId) => {
    const { data } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (data) {
      setChatHistory(data);
      const savedId = sessionStorage.getItem('currentChatId');
      if (savedId) {
        const existingChat = data.find(c => c.id === savedId);
        if (existingChat) {
          setMessages(existingChat.messages);
          setCurrentChatId(savedId);
        } else {
          setCurrentChatId(savedId);
          setMessages([]);
        }
      } else {
        createNewChat();
      }
    }
  };

  const createNewChat = () => {
    const newId = crypto.randomUUID();
    setCurrentChatId(newId);
    sessionStorage.setItem('currentChatId', newId);
    setMessages([]);
    if (window.innerWidth <= 768) setIsSidebarOpen(false);
  };

  const loadChat = (id, history = chatHistory) => {
    const chat = history.find(c => c.id === id);
    if (chat) {
      setCurrentChatId(id);
      sessionStorage.setItem('currentChatId', id);
      setMessages(chat.messages);
    }
    if (window.innerWidth <= 768) setIsSidebarOpen(false);
  };

  const saveChat = async (messagesToSave) => {
    if (!session) return;
    const title = messagesToSave.find(m => m.role === 'user')?.content.substring(0, 40) || 'New Consultation';
    await supabase.from('chats').upsert({
      id: currentChatId,
      user_id: session.user.id,
      title,
      messages: messagesToSave,
      updated_at: new Date().toISOString()
    });
    fetchChats(session.user.id);
  };

  const deleteChat = async (e, id) => {
    e.stopPropagation();
    const { error } = await supabase.from('chats').delete().eq('id', id);
    if (!error) {
      const updated = chatHistory.filter(c => c.id !== id);
      setChatHistory(updated);
      if (currentChatId === id) {
        sessionStorage.removeItem('currentChatId');
        if (updated.length > 0) loadChat(updated[0].id, updated);
        else createNewChat();
      }
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      if (authMode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } }
        });
        if (error) throw error;
        setAuthError("Check your email for confirmation!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    setSettingsStatus({ type: 'loading', message: 'Updating...' });
    try {
      const updates = {};
      if (newName !== session.user.user_metadata.full_name) updates.data = { full_name: newName };
      if (newEmail !== session.user.email) updates.email = newEmail;
      if (newPassword) updates.password = newPassword;
      const { error } = await supabase.auth.updateUser(updates);
      if (error) throw error;
      setSettingsStatus({ type: 'success', message: 'Profile updated!' });
      setNewPassword('');
    } catch (error) {
      setSettingsStatus({ type: 'error', message: error.message });
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiBaseUrl}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.content }),
      });
      const data = await response.json();
      const botMsg = {
        role: 'assistant',
        content: data.answer,
        source: data.source,
        entities: data.entities
      };
      const finalMessages = [...newMessages, botMsg];
      setMessages(finalMessages);
      saveChat(finalMessages);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Network error. Please check if the backend is running.' }]);
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <BotIcon />
            <h2>{authMode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
            <p>Your secure Medical AI Assistant</p>
          </div>
          <form onSubmit={handleAuth}>
            {authMode === 'signup' && (
              <div className="input-group">
                <label>Full Name</label>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
            )}
            <div className="input-group">
              <label>Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="input-group">
              <label>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {authError && <div className={`auth-msg ${authError.includes('check') ? 'success' : 'error'}`}>{authError}</div>}
            <button className="auth-btn" type="submit" disabled={authLoading}>
              {authLoading ? 'Processing...' : authMode === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          </form>
          <p className="auth-toggle">
            {authMode === 'login' ? "Don't have an account?" : "Already have an account?"}
            <button onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}>
              {authMode === 'login' ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {showProfile && (
        <div className="modal-overlay" onClick={() => setShowProfile(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>User Profile</h3>
              <button onClick={() => setShowProfile(false)}><CloseIcon /></button>
            </div>
            <form onSubmit={updateProfile}>
              <div className="input-group">
                <label>Display Name</label>
                <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} />
              </div>
              <div className="input-group">
                <label>Email Address</label>
                <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
              </div>
              <div className="input-group">
                <label>New Password (Optional)</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
              </div>
              {settingsStatus.message && (
                <div className={`settings-msg ${settingsStatus.type}`}>{settingsStatus.message}</div>
              )}
              <button className="save-btn" type="submit">Update Profile</button>
            </form>
          </div>
        </div>
      )}

      {isSidebarOpen && window.innerWidth <= 768 && (
        <div className="overlay" onClick={() => setIsSidebarOpen(false)} />
      )}

      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <button className="new-btn" onClick={createNewChat}>
            <PlusIcon /> <span>New Chat</span>
          </button>
          <button className="icon-btn sidebar-close" onClick={() => setIsSidebarOpen(false)}>
            <CloseIcon />
          </button>
        </div>
        <nav className="history">
          <p className="section-title">Recent Chats</p>
          {chatHistory.map(chat => (
            <div key={chat.id} className={`chat-item ${currentChatId === chat.id ? 'active' : ''}`} onClick={() => loadChat(chat.id)}>
              <span className="title">{chat.title}</span>
              <button className="del-btn" onClick={(e) => deleteChat(e, chat.id)}><TrashIcon /></button>
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="footer-btn" onClick={() => setShowProfile(true)}>
            <ProfileIcon /> <span>Profile</span>
          </button>
          <button className="footer-btn logout" onClick={() => supabase.auth.signOut()}>
            <LogoutIcon /> <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="navbar">
          <button className={`icon-btn ${isSidebarOpen ? 'hidden' : ''}`} onClick={() => setIsSidebarOpen(true)}>
            <MenuIcon />
          </button>
          <div className="brand">
            <img src="/logo.png" alt="Medical AI Logo" className="brand-logo" />
            <h1>Medical AI</h1>
          </div>
          <div className="spacer" />
        </header>

        <section className="chat-viewport">
          {messages.length === 0 ? (
            <div className="greeting-container">
              <div className="greeting-logo">
                <img src="/logo.png" alt="Medical AI Logo" />
              </div>
              <h2>Welcome, {session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'User'}</h2>
              <h3>How can I assist you with your health queries today?</h3>
              <p className="greeting-subtitle">Your secure, AI-powered medical assistant. Type a question below or choose a suggestion to get started.</p>
              <div className="quick-suggestions">
                {suggestions.map((sug, idx) => (
                  <div key={idx} className="suggestion-card" onClick={() => setInput(sug.query)}>
                    <h4>{sug.title}</h4>
                    <p>{sug.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="message-container">
              {messages.map((msg, i) => (
                <div key={i} className={`message-block ${msg.role}`}>
                  <div className="msg-wrapper">
                    <div className={`msg-avatar ${msg.role}`}>
                      {msg.role === 'assistant' ? <BotIcon /> : <UserIcon />}
                    </div>
                    <div className="msg-body">
                      <div className="text" dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                      {msg.source && <div className="source">Source: {msg.source}</div>}
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="message-block assistant loading">
                  <div className="msg-wrapper">
                    <div className={`msg-avatar assistant`}><BotIcon /></div>
                    <div className="loader"><span></span><span></span><span></span></div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}
        </section>

        <footer className="input-zone">
          <div className="input-box">
            <textarea
              placeholder="Ask anything..."
              rows="1"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <button className="send-action" onClick={handleSend} disabled={!input.trim() || loading}>
              <SendIcon />
            </button>
          </div>
          <p className="fine-print">Consult a doctor for clinical diagnosis.</p>
        </footer>
      </main>
    </div>
  )
}

export default App
