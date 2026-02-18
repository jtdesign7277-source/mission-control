'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Archive,
  BellRing,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  Pencil,
  Plus,
  RefreshCw,
  Reply,
  Rocket,
  Save,
  Send,
  Server,
  Shield,
  Trash2,
  X,
} from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

const VIEW_TABS = [
  { id: 'split', label: 'Split' },
  { id: 'feed', label: 'Feed' },
  { id: 'kanban', label: 'Kanban' },
  { id: 'deployments', label: 'Deployments' },
  { id: 'email', label: 'Email' },
  { id: 'contacts', label: 'Contacts' },
  { id: 'keys', label: 'Keys' },
];

const STATUS_COLORS = {
  ok: 'bg-emerald-400',
  ready: 'bg-emerald-400',
  success: 'bg-emerald-400',
  completed: 'bg-emerald-400',
  healthy: 'bg-emerald-400',
  running: 'bg-rose-400',
  building: 'bg-amber-400',
  queued: 'bg-sky-400',
  warning: 'bg-amber-400',
  error: 'bg-rose-400',
  failed: 'bg-rose-400',
  canceled: 'bg-slate-500',
  unknown: 'bg-zinc-500',
};

const STATUS_TEXT_COLORS = {
  running: 'text-rose-400',
  building: 'text-amber-400',
  queued: 'text-sky-400',
  completed: 'text-emerald-400',
  ok: 'text-emerald-400',
  ready: 'text-emerald-400',
  success: 'text-emerald-400',
  healthy: 'text-emerald-400',
  error: 'text-rose-400',
  failed: 'text-rose-400',
  canceled: 'text-slate-400',
  unknown: 'text-zinc-400',
};

const DEPLOYMENT_REFRESH_MS = 10000;
const EMAIL_REFRESH_MS = 30000;

const KEY_CATEGORIES = ['All', 'Trading', 'AI', 'Email', 'DevOps', 'Other'];
const CONTACT_CATEGORIES = ['All', 'Client', 'Investor', 'Vendor', 'Team', 'Personal', 'Other'];

const EMPTY_KEY_FORM = {
  service: '',
  name: '',
  keyValue: '',
  category: 'Trading',
  notes: '',
};

const EMPTY_COMPOSE_FORM = {
  to: '',
  subject: '',
  body: '',
  replyTo: '',
};

const EMPTY_CONTACT_FORM = {
  name: '',
  email: '',
  company: '',
  phone: '',
  category: 'Client',
  notes: '',
};

function normalizeStatus(value) {
  return String(value || 'unknown').trim().toLowerCase();
}

function statusDotClass(status) {
  const normalized = normalizeStatus(status);
  return STATUS_COLORS[normalized] || STATUS_COLORS.unknown;
}

function statusTextClass(status) {
  const normalized = normalizeStatus(status);
  return STATUS_TEXT_COLORS[normalized] || STATUS_TEXT_COLORS.unknown;
}

function timeAgo(timestamp) {
  if (!timestamp) return 'now';
  try {
    return `${formatDistanceToNowStrict(new Date(timestamp))} ago`;
  } catch {
    return 'now';
  }
}

function formatDurationMs(ms) {
  if (!Number.isFinite(ms)) return '—';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
}

function prettyStatus(status) {
  return String(status || 'UNKNOWN').toUpperCase();
}

function eventTitle(event) {
  return `${event.source || 'unknown'} · ${event.action || 'event'}`;
}

function parseEmailAddress(fromValue) {
  const raw = String(fromValue || '').trim();
  if (!raw) return '';
  const match = raw.match(/<([^>]+)>/);
  return match?.[1] || raw;
}

function StatCard({ label, value, tone = 'text-white' }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">{label}</p>
      <p className={`mt-2 text-lg font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

function EventRow({ event }) {
  const status = normalizeStatus(event.status);
  const borderColor = BORDER_COLORS[status] || BORDER_COLORS.unknown;
  const isActive = status === 'running' || status === 'building' || status === 'queued';

  return (
    <div className={`rounded-lg border border-white/10 border-l-[3px] ${borderColor} bg-black/25 px-3 py-2`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm text-zinc-100">{eventTitle(event)}</p>
          <p className="mt-1 text-xs text-zinc-500">{timeAgo(event.created_at)}</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className={`h-2 w-2 rounded-full ${statusDotClass(status)} ${isActive ? 'animate-pulse' : ''}`} />
          <span className={`uppercase tracking-wider font-medium ${statusTextClass(status)}`}>{prettyStatus(status)}</span>
        </div>
      </div>
      {Number.isFinite(event.duration) && (
        <p className="mt-2 text-xs text-zinc-500">duration: {formatDurationMs(event.duration)}</p>
      )}
    </div>
  );
}

const BORDER_COLORS = {
  running: 'border-l-rose-400',
  building: 'border-l-amber-400',
  queued: 'border-l-sky-400',
  completed: 'border-l-emerald-400',
  ok: 'border-l-emerald-400',
  ready: 'border-l-emerald-400',
  success: 'border-l-emerald-400',
  error: 'border-l-rose-400',
  failed: 'border-l-rose-400',
  canceled: 'border-l-slate-500',
  unknown: 'border-l-zinc-500',
};

function DeploymentCard({ deployment }) {
  const status = normalizeStatus(deployment.status);
  const borderColor = BORDER_COLORS[status] || BORDER_COLORS.unknown;
  const isActive = status === 'running' || status === 'building' || status === 'queued';

  return (
    <article className={`rounded-xl border border-white/10 border-l-[3px] ${borderColor} bg-black/35 p-4`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-zinc-100">{deployment.project}</p>
          <p className="mt-1 truncate text-sm text-zinc-400">{deployment.commitMessage}</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className={`h-2 w-2 rounded-full ${statusDotClass(status)} ${isActive ? 'animate-pulse' : ''}`} />
          <span className={`uppercase tracking-wider font-medium ${statusTextClass(status)}`}>{prettyStatus(deployment.status)}</span>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-zinc-500">
        <p>branch: <span className="text-zinc-300">{deployment.branch}</span></p>
        <p>duration: <span className="text-zinc-300">{formatDurationMs(deployment.durationMs)}</span></p>
        <p>time: <span className="text-zinc-300">{timeAgo(deployment.timestamp)}</span></p>
        <p>
          link:{' '}
          {deployment.url ? (
            <a href={deployment.url} target="_blank" rel="noreferrer" className="text-sky-300 hover:text-sky-200">
              open
            </a>
          ) : (
            <span className="text-zinc-300">—</span>
          )}
        </p>
      </div>
    </article>
  );
}

export default function MissionControlPage() {
  const [activeView, setActiveView] = useState('split');

  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState('');

  const [deployments, setDeployments] = useState([]);
  const [deploymentsLoading, setDeploymentsLoading] = useState(false);
  const [deploymentsError, setDeploymentsError] = useState('');

  const [emails, setEmails] = useState([]);
  const [emailsLoading, setEmailsLoading] = useState(false);
  const [emailsError, setEmailsError] = useState('');
  const [selectedEmailId, setSelectedEmailId] = useState('');
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [emailDetailLoading, setEmailDetailLoading] = useState(false);
  const [emailActionLoading, setEmailActionLoading] = useState(false);
  const [emailPanelView, setEmailPanelView] = useState('inbox');

  const [composeOpen, setComposeOpen] = useState(false);
  const [composeSending, setComposeSending] = useState(false);
  const [composeForm, setComposeForm] = useState(EMPTY_COMPOSE_FORM);
  const [composeToFocused, setComposeToFocused] = useState(false);

  const [contacts, setContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactsError, setContactsError] = useState('');
  const [contactSearch, setContactSearch] = useState('');
  const [contactCategory, setContactCategory] = useState('All');
  const [selectedContactId, setSelectedContactId] = useState('');
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [contactForm, setContactForm] = useState(EMPTY_CONTACT_FORM);
  const [contactSaving, setContactSaving] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importCsvValue, setImportCsvValue] = useState('');
  const [importingContacts, setImportingContacts] = useState(false);

  const [keys, setKeys] = useState([]);
  const [keysLoading, setKeysLoading] = useState(false);
  const [keysError, setKeysError] = useState('');
  const [keySearch, setKeySearch] = useState('');
  const [keyCategory, setKeyCategory] = useState('All');
  const [revealedKeys, setRevealedKeys] = useState({});
  const [keyModalOpen, setKeyModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [keyForm, setKeyForm] = useState(EMPTY_KEY_FORM);
  const [keySaving, setKeySaving] = useState(false);

  const supabaseReady = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  const fetchDeployments = useCallback(async () => {
    setDeploymentsLoading(true);
    try {
      const res = await fetch('/api/deployments', { cache: 'no-store' });
      const payload = await res.json();

      if (!res.ok) throw new Error(payload.error || 'Failed to fetch deployments');

      setDeployments(payload.deployments || []);
      setDeploymentsError('');
    } catch (error) {
      setDeploymentsError(error.message || 'Failed to fetch deployments');
    } finally {
      setDeploymentsLoading(false);
    }
  }, []);

  const fetchInbox = useCallback(async () => {
    setEmailsLoading(true);
    try {
      const res = await fetch('/api/email/inbox', { cache: 'no-store' });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Failed to fetch inbox');

      const nextEmails = payload.emails || [];
      setEmails(nextEmails);
      setEmailsError('');

      if (!selectedEmailId && nextEmails[0]?.id) {
        setSelectedEmailId(nextEmails[0].id);
      }
    } catch (error) {
      setEmailsError(error.message || 'Failed to fetch inbox');
    } finally {
      setEmailsLoading(false);
    }
  }, [selectedEmailId]);

  const fetchEmailDetail = useCallback(async (id) => {
    if (!id) return;
    setEmailDetailLoading(true);
    try {
      const res = await fetch(`/api/email/${id}`, { cache: 'no-store' });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Failed to fetch email');
      setSelectedEmail(payload.email || null);
    } catch (error) {
      setEmailsError(error.message || 'Failed to load email');
      setSelectedEmail(null);
    } finally {
      setEmailDetailLoading(false);
    }
  }, []);

  const runEmailAction = useCallback(
    async (action) => {
      if (!selectedEmailId) return;
      setEmailActionLoading(true);
      try {
        const res = await fetch(`/api/email/${selectedEmailId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action }),
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error || 'Email action failed');

        if (action === 'archive') {
          setSelectedEmailId('');
          setSelectedEmail(null);
        }

        await fetchInbox();
        if (selectedEmailId && action !== 'archive') {
          await fetchEmailDetail(selectedEmailId);
        }
      } catch (error) {
        setEmailsError(error.message || 'Failed to update email');
      } finally {
        setEmailActionLoading(false);
      }
    },
    [fetchEmailDetail, fetchInbox, selectedEmailId],
  );

  const fetchKeys = useCallback(async () => {
    setKeysLoading(true);
    try {
      const params = new URLSearchParams();
      if (keyCategory !== 'All') params.set('category', keyCategory);
      if (keySearch.trim()) params.set('search', keySearch.trim());

      const res = await fetch(`/api/keys?${params.toString()}`, { cache: 'no-store' });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Failed to fetch keys');

      setKeys(payload.keys || []);
      setKeysError('');
    } catch (error) {
      setKeysError(error.message || 'Failed to fetch keys');
    } finally {
      setKeysLoading(false);
    }
  }, [keyCategory, keySearch]);

  const fetchContacts = useCallback(async () => {
    setContactsLoading(true);
    try {
      const res = await fetch('/api/contacts', { cache: 'no-store' });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Failed to fetch contacts');

      setContacts(payload.contacts || []);
      setContactsError('');
    } catch (error) {
      setContactsError(error.message || 'Failed to fetch contacts');
    } finally {
      setContactsLoading(false);
    }
  }, []);

  const revealKey = useCallback(async (id) => {
    try {
      const res = await fetch(`/api/keys/${id}/reveal`, { cache: 'no-store' });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Failed to reveal key');

      setRevealedKeys((prev) => ({ ...prev, [id]: payload.keyValue }));

      setTimeout(() => {
        setRevealedKeys((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }, 5000);

      fetchKeys();
    } catch (error) {
      setKeysError(error.message || 'Failed to reveal key');
    }
  }, [fetchKeys]);

  const copyValue = useCallback(async (value) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // no-op
    }
  }, []);

  const submitKeyForm = useCallback(async () => {
    const payload = {
      service: keyForm.service.trim(),
      name: keyForm.name.trim(),
      keyValue: keyForm.keyValue,
      category: keyForm.category,
      notes: keyForm.notes,
    };

    if (!payload.service || !payload.name || (!editingKey && !payload.keyValue)) {
      setKeysError('Service, key name, and key value are required.');
      return;
    }

    setKeySaving(true);

    try {
      const url = editingKey ? `/api/keys/${editingKey.id}` : '/api/keys';
      const method = editingKey ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to save key');

      setKeyModalOpen(false);
      setEditingKey(null);
      setKeyForm(EMPTY_KEY_FORM);
      await fetchKeys();
    } catch (error) {
      setKeysError(error.message || 'Failed to save key');
    } finally {
      setKeySaving(false);
    }
  }, [editingKey, fetchKeys, keyForm]);

  const deleteKey = useCallback(async (id) => {
    if (!window.confirm('Delete this key?')) return;

    try {
      const res = await fetch(`/api/keys/${id}`, { method: 'DELETE' });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Failed to delete key');

      await fetchKeys();
    } catch (error) {
      setKeysError(error.message || 'Failed to delete key');
    }
  }, [fetchKeys]);

  const submitContactForm = useCallback(async () => {
    const payload = {
      name: contactForm.name.trim(),
      email: contactForm.email.trim(),
      company: contactForm.company.trim(),
      phone: contactForm.phone.trim(),
      category: contactForm.category,
      notes: contactForm.notes,
    };

    if (!payload.name || !payload.email) {
      setContactsError('Name and email are required.');
      return;
    }

    setContactSaving(true);
    try {
      const url = editingContact ? `/api/contacts/${editingContact.id}` : '/api/contacts';
      const method = editingContact ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to save contact');

      setContactModalOpen(false);
      setEditingContact(null);
      setContactForm(EMPTY_CONTACT_FORM);
      await fetchContacts();
    } catch (error) {
      setContactsError(error.message || 'Failed to save contact');
    } finally {
      setContactSaving(false);
    }
  }, [contactForm, editingContact, fetchContacts]);

  const deleteContact = useCallback(async (id) => {
    if (!window.confirm('Delete this contact?')) return;

    try {
      const res = await fetch(`/api/contacts/${id}`, { method: 'DELETE' });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Failed to delete contact');

      if (selectedContactId === id) {
        setSelectedContactId('');
      }

      await fetchContacts();
    } catch (error) {
      setContactsError(error.message || 'Failed to delete contact');
    }
  }, [fetchContacts, selectedContactId]);

  const importContacts = useCallback(async () => {
    const lines = importCsvValue
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      setContactsError('Paste at least one CSV line in format: name,email');
      return;
    }

    const parsedContacts = lines
      .map((line) => {
        const [rawName, rawEmail] = line.split(',');
        const name = String(rawName || '').trim();
        const email = String(rawEmail || '').trim();
        return { name, email };
      })
      .filter((entry) => entry.name && entry.email)
      .filter((entry) => {
        const lowerName = entry.name.toLowerCase();
        const lowerEmail = entry.email.toLowerCase();
        return !(lowerName === 'name' && lowerEmail === 'email');
      });

    if (parsedContacts.length === 0) {
      setContactsError('No valid rows found. Use one contact per line: name,email');
      return;
    }

    setImportingContacts(true);
    try {
      const responses = await Promise.all(
        parsedContacts.map((entry) =>
          fetch('/api/contacts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...entry,
              category: 'Other',
            }),
          }),
        ),
      );

      const failed = responses.filter((response) => !response.ok).length;
      if (failed) {
        setContactsError(`${failed} contact(s) failed to import.`);
      } else {
        setContactsError('');
      }

      setImportModalOpen(false);
      setImportCsvValue('');
      await fetchContacts();
    } catch (error) {
      setContactsError(error.message || 'Failed to import contacts');
    } finally {
      setImportingContacts(false);
    }
  }, [fetchContacts, importCsvValue]);

  const sendEmail = useCallback(async () => {
    if (!composeForm.to.trim() || !composeForm.subject.trim() || !composeForm.body.trim()) {
      setEmailsError('To, subject, and body are required.');
      return;
    }

    setComposeSending(true);
    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: composeForm.to.trim(),
          subject: composeForm.subject.trim(),
          text: composeForm.body,
          replyTo: composeForm.replyTo || undefined,
        }),
      });

      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Failed to send email');

      const recipients = composeForm.to
        .split(',')
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean);

      const matchingContacts = contacts.filter((contact) =>
        recipients.includes(String(contact.email || '').trim().toLowerCase()),
      );

      if (matchingContacts.length > 0) {
        await Promise.all(
          matchingContacts.map((contact) =>
            fetch(`/api/contacts/${contact.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ last_emailed: new Date().toISOString() }),
            }),
          ),
        );
      }

      setComposeOpen(false);
      setComposeForm(EMPTY_COMPOSE_FORM);
      setComposeToFocused(false);
      await fetchInbox();
      await fetchContacts();
    } catch (error) {
      setEmailsError(error.message || 'Failed to send email');
    } finally {
      setComposeSending(false);
    }
  }, [composeForm, contacts, fetchContacts, fetchInbox]);

  useEffect(() => {
    fetchDeployments();
    const timer = setInterval(fetchDeployments, DEPLOYMENT_REFRESH_MS);
    return () => clearInterval(timer);
  }, [fetchDeployments]);

  useEffect(() => {
    fetchInbox();
    const timer = setInterval(fetchInbox, EMAIL_REFRESH_MS);
    return () => clearInterval(timer);
  }, [fetchInbox]);

  useEffect(() => {
    if (!selectedEmailId) return;
    fetchEmailDetail(selectedEmailId);
  }, [selectedEmailId, fetchEmailDetail]);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  useEffect(() => {
    if (!selectedContactId && contacts[0]?.id) {
      setSelectedContactId(contacts[0].id);
      return;
    }

    if (selectedContactId && !contacts.some((contact) => contact.id === selectedContactId)) {
      setSelectedContactId(contacts[0]?.id || '');
    }
  }, [contacts, selectedContactId]);

  useEffect(() => {
    if (!supabaseReady) {
      setEventsLoading(false);
      setEventsError('Supabase env is missing; realtime feed is unavailable.');
      return;
    }

    let channel;
    let cancelled = false;

    async function setup() {
      try {
        const supabase = getSupabaseBrowserClient();

        const { data, error } = await supabase
          .from('activity_events')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) throw error;
        if (!cancelled) {
          setEvents(data || []);
          setEventsError('');
          setEventsLoading(false);
        }

        channel = supabase
          .channel('mission-control-activity-events')
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'activity_events' },
            (payload) => {
              setEvents((prev) => [payload.new, ...prev].slice(0, 100));
            },
          )
          .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'activity_events' },
            (payload) => {
              setEvents((prev) =>
                prev.map((item) => (item.id === payload.new.id ? { ...item, ...payload.new } : item)),
              );
            },
          )
          .on(
            'postgres_changes',
            { event: 'DELETE', schema: 'public', table: 'activity_events' },
            (payload) => {
              setEvents((prev) => prev.filter((item) => item.id !== payload.old.id));
            },
          )
          .subscribe();
      } catch (error) {
        if (!cancelled) {
          setEventsError(error.message || 'Failed to initialize realtime feed');
          setEventsLoading(false);
        }
      }
    }

    setup();

    return () => {
      cancelled = true;
      if (channel) {
        const supabase = getSupabaseBrowserClient();
        supabase.removeChannel(channel);
      }
    };
  }, [supabaseReady]);

  const eventColumns = useMemo(() => {
    const columns = {
      queued: [],
      running: [],
      completed: [],
      failed: [],
    };

    events.forEach((event) => {
      const status = normalizeStatus(event.status);
      if (status.includes('queue')) {
        columns.queued.push(event);
      } else if (status.includes('running') || status.includes('build') || status.includes('process')) {
        columns.running.push(event);
      } else if (status.includes('completed') || status.includes('ready') || status.includes('ok') || status.includes('success')) {
        columns.completed.push(event);
      } else if (status.includes('failed') || status.includes('error') || status.includes('cancel')) {
        columns.failed.push(event);
      } else {
        columns.failed.push(event);
      }
    });

    return columns;
  }, [events]);

  const totalErrors = useMemo(
    () =>
      events.filter((event) => {
        const status = normalizeStatus(event.status);
        return status.includes('error') || status.includes('failed');
      }).length,
    [events],
  );

  const selectedContact = useMemo(
    () => contacts.find((contact) => contact.id === selectedContactId) || null,
    [contacts, selectedContactId],
  );

  const filteredContacts = useMemo(() => {
    const query = contactSearch.trim().toLowerCase();

    return contacts.filter((contact) => {
      if (contactCategory !== 'All' && (contact.category || 'Other') !== contactCategory) {
        return false;
      }

      if (!query) return true;

      const name = String(contact.name || '').toLowerCase();
      const email = String(contact.email || '').toLowerCase();
      const company = String(contact.company || '').toLowerCase();

      return name.includes(query) || email.includes(query) || company.includes(query);
    });
  }, [contacts, contactCategory, contactSearch]);

  const composeContactSuggestions = useMemo(() => {
    const query = composeForm.to.trim().toLowerCase();
    if (!query) return [];

    return contacts
      .filter((contact) => {
        const name = String(contact.name || '').toLowerCase();
        const email = String(contact.email || '').toLowerCase();
        return name.includes(query) || email.includes(query);
      })
      .slice(0, 8);
  }, [composeForm.to, contacts]);

  const openComposeForReply = () => {
    if (!selectedEmail) return;
    setComposeForm({
      to: parseEmailAddress(selectedEmail.sender),
      subject: selectedEmail.subject?.startsWith('Re:') ? selectedEmail.subject : `Re: ${selectedEmail.subject}`,
      body: '\n\n---\n' + (selectedEmail.text || selectedEmail.snippet || ''),
      replyTo: parseEmailAddress(selectedEmail.sender),
    });
    setComposeOpen(true);
  };

  const openCreateKey = () => {
    setEditingKey(null);
    setKeyForm(EMPTY_KEY_FORM);
    setKeyModalOpen(true);
  };

  const openComposeForContact = (contact) => {
    if (!contact?.email) return;
    setComposeForm({
      ...EMPTY_COMPOSE_FORM,
      to: contact.email,
    });
    setComposeOpen(true);
  };

  const openCreateContact = () => {
    setEditingContact(null);
    setContactForm(EMPTY_CONTACT_FORM);
    setContactModalOpen(true);
  };

  const openEditContact = (contact) => {
    setEditingContact(contact);
    setContactForm({
      name: contact.name || '',
      email: contact.email || '',
      company: contact.company || '',
      phone: contact.phone || '',
      category: contact.category || 'Other',
      notes: contact.notes || '',
    });
    setContactModalOpen(true);
  };

  const openEditKey = (item) => {
    setEditingKey(item);
    setKeyForm({
      service: item.service,
      name: item.name,
      keyValue: '',
      category: item.category || 'Other',
      notes: item.notes || '',
    });
    setKeyModalOpen(true);
  };

  return (
    <main className="min-h-screen bg-transparent px-6 py-6 text-zinc-100">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-5">
        <header className="rounded-2xl border border-white/10 bg-gradient-to-r from-[#0b1220] via-[#0d1527] to-[#111a31] p-5 shadow-[0_0_80px_rgba(34,197,94,0.06)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-zinc-500">Mission Control</p>
              <h1 className="mt-2 text-3xl font-semibold text-zinc-50">Automation Command Center</h1>
              <p className="mt-1 text-sm text-zinc-400">
                Unified operations for activity streams, deployments, inbox automation, and secure API vault.
              </p>
            </div>
            <div className="grid min-w-[300px] grid-cols-2 gap-3">
              <StatCard label="Activity Events" value={String(events.length)} />
              <StatCard label="Deployments" value={String(deployments.length)} />
              <StatCard label="Unread Emails" value={String(emails.filter((item) => item.unread).length)} tone="text-amber-300" />
              <StatCard label="Event Errors" value={String(totalErrors)} tone={totalErrors > 0 ? 'text-rose-300' : 'text-zinc-100'} />
            </div>
          </div>
        </header>

        <section className="rounded-2xl border border-white/10 bg-black/35 p-3">
          <div className="flex flex-wrap items-center gap-2">
            {VIEW_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveView(tab.id)}
                className={`rounded-lg px-3 py-2 text-sm transition ${
                  activeView === tab.id
                    ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/50'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        {activeView === 'split' && (
          <section className="grid min-h-[65vh] grid-cols-1 gap-4 lg:grid-cols-2">
            <article className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <BellRing className="h-4 w-4 text-emerald-300" />
                  Live Activity Feed
                </h2>
                {eventsLoading && <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />}
              </div>
              {eventsError && <p className="mb-3 text-sm text-rose-300">{eventsError}</p>}
              <div className="space-y-2">
                {events.slice(0, 10).map((event) => (
                  <EventRow key={event.id} event={event} />
                ))}
                {!eventsLoading && events.length === 0 && (
                  <p className="rounded-lg border border-white/10 bg-black/20 px-3 py-5 text-sm text-zinc-500">
                    No events yet. Send a POST request to <code>/api/activity</code> to start the stream.
                  </p>
                )}
              </div>
            </article>

            <article className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <Rocket className="h-4 w-4 text-amber-300" />
                  Deployment Watch
                </h2>
                <button
                  type="button"
                  onClick={fetchDeployments}
                  className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-xs text-zinc-300 hover:bg-white/5"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${deploymentsLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
              {deploymentsError && <p className="mb-3 text-sm text-rose-300">{deploymentsError}</p>}
              <div className="space-y-2">
                {deployments.slice(0, 8).map((deployment) => (
                  <DeploymentCard key={deployment.id} deployment={deployment} />
                ))}
                {!deploymentsLoading && deployments.length === 0 && (
                  <p className="rounded-lg border border-white/10 bg-black/20 px-3 py-5 text-sm text-zinc-500">No deployments returned from Vercel API.</p>
                )}
              </div>
            </article>
          </section>
        )}

        {activeView === 'feed' && (
          <section className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Server className="h-4 w-4 text-emerald-300" />
                Event Feed
              </h2>
            </div>
            {eventsError && <p className="mb-3 text-sm text-rose-300">{eventsError}</p>}
            <div className="space-y-2">
              {events.map((event) => (
                <EventRow key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}

        {activeView === 'kanban' && (
          <section className="grid grid-cols-1 gap-4 xl:grid-cols-4">
            {[
              { id: 'queued', label: 'QUEUED', color: 'text-sky-400' },
              { id: 'running', label: 'RUNNING', color: 'text-rose-400' },
              { id: 'completed', label: 'COMPLETED', color: 'text-emerald-400' },
              { id: 'failed', label: 'FAILED', color: 'text-rose-400' },
            ].map((column) => (
              <article key={column.id} className="rounded-2xl border border-white/10 bg-black/30 p-3">
                <h3 className={`mb-3 text-sm uppercase tracking-[0.2em] ${column.color}`}>{column.label}</h3>
                <div className="space-y-2">
                  {(eventColumns[column.id] || []).map((event) => (
                    <EventRow key={event.id} event={event} />
                  ))}
                  {(eventColumns[column.id] || []).length === 0 && (
                    <p className="rounded-lg border border-dashed border-white/10 px-3 py-4 text-xs text-zinc-500">No events</p>
                  )}
                </div>
              </article>
            ))}
          </section>
        )}

        {activeView === 'deployments' && (
          <section className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Rocket className="h-4 w-4 text-amber-300" />
                Vercel Deployments (auto-refresh: 10s)
              </h2>
              <button
                type="button"
                onClick={fetchDeployments}
                className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-sm text-zinc-300 hover:bg-white/5"
              >
                <RefreshCw className={`h-4 w-4 ${deploymentsLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
            {deploymentsError && <p className="mb-3 text-sm text-rose-300">{deploymentsError}</p>}
            <div className="grid gap-3 lg:grid-cols-2">
              {deployments.map((deployment) => (
                <DeploymentCard key={deployment.id} deployment={deployment} />
              ))}
            </div>
          </section>
        )}

        {activeView === 'email' && (
          <section className="grid min-h-[70vh] grid-cols-1 gap-4 xl:grid-cols-[340px_1fr]">
            <article className="rounded-2xl border border-white/10 bg-black/30 p-3">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-zinc-300">
                  <Mail className="h-4 w-4 text-sky-300" />
                  Email
                </h2>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setComposeOpen(true)}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-xs text-zinc-200 hover:bg-white/5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Compose
                  </button>
                  <button
                    type="button"
                    onClick={() => (emailPanelView === 'inbox' ? fetchInbox() : fetchContacts())}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-xs text-zinc-300 hover:bg-white/5"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${emailPanelView === 'inbox' ? (emailsLoading ? 'animate-spin' : '') : (contactsLoading ? 'animate-spin' : '')}`} />
                    Refresh
                  </button>
                </div>
              </div>
              <div className="mb-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEmailPanelView('inbox')}
                  className={`rounded-lg px-3 py-1.5 text-xs transition ${
                    emailPanelView === 'inbox'
                      ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/40'
                      : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-100'
                  }`}
                >
                  Inbox ({emails.length})
                </button>
                <button
                  type="button"
                  onClick={() => setEmailPanelView('contacts')}
                  className={`rounded-lg px-3 py-1.5 text-xs transition ${
                    emailPanelView === 'contacts'
                      ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/40'
                      : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-100'
                  }`}
                >
                  Contacts ({contacts.length})
                </button>
              </div>

              {emailPanelView === 'contacts' && (
                <div className="mb-3 space-y-2">
                  <input
                    value={contactSearch}
                    onChange={(event) => setContactSearch(event.target.value)}
                    placeholder="Search contacts..."
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={openCreateContact}
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-200 hover:bg-emerald-500/20"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportModalOpen(true)}
                      className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-[11px] text-zinc-200 hover:bg-white/5"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Import
                    </button>
                  </div>
                </div>
              )}

              {emailPanelView === 'inbox' && emailsError && <p className="mb-2 text-xs text-rose-300">{emailsError}</p>}
              {emailPanelView === 'contacts' && contactsError && <p className="mb-2 text-xs text-rose-300">{contactsError}</p>}

              <div className="space-y-2">
                {emailPanelView === 'inbox' &&
                  emails.map((email) => (
                    <button
                      key={email.id}
                      type="button"
                      onClick={() => setSelectedEmailId(email.id)}
                      className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                        selectedEmailId === email.id
                          ? 'border-emerald-400/40 bg-emerald-500/10'
                          : 'border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/5'
                      }`}
                    >
                      <p className="truncate text-xs uppercase tracking-wider text-zinc-500">{timeAgo(email.timestamp)}</p>
                      <p className="mt-1 truncate text-sm font-medium text-zinc-100">{email.subject}</p>
                      <p className="truncate text-xs text-zinc-400">{email.sender}</p>
                      <p className="mt-1 truncate text-xs text-zinc-500">{email.snippet}</p>
                      {email.unread && <p className="mt-1 text-[11px] text-amber-300">Unread</p>}
                    </button>
                  ))}

                {emailPanelView === 'contacts' &&
                  filteredContacts.map((contact) => (
                    <button
                      key={contact.id}
                      type="button"
                      onClick={() => setSelectedContactId(contact.id)}
                      className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                        selectedContactId === contact.id
                          ? 'border-emerald-400/40 bg-emerald-500/10'
                          : 'border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/5'
                      }`}
                    >
                      <p className="truncate text-sm font-medium text-zinc-100">{contact.name}</p>
                      <p className="truncate text-xs text-zinc-400">{contact.email}</p>
                      <p className="mt-1 truncate text-xs text-zinc-500">{contact.company || 'No company'}</p>
                      <p className="mt-1 text-[11px] text-zinc-600">{contact.category || 'Other'}</p>
                    </button>
                  ))}

                {emailPanelView === 'inbox' && !emailsLoading && emails.length === 0 && (
                  <p className="rounded-lg border border-dashed border-white/10 px-3 py-4 text-xs text-zinc-500">No emails</p>
                )}
                {emailPanelView === 'contacts' && !contactsLoading && filteredContacts.length === 0 && (
                  <p className="rounded-lg border border-dashed border-white/10 px-3 py-4 text-xs text-zinc-500">No contacts</p>
                )}
              </div>
            </article>

            <article className="rounded-2xl border border-white/10 bg-black/30 p-4">
              {emailPanelView === 'inbox' && (
                <>
                  {!selectedEmailId && (
                    <p className="text-sm text-zinc-500">Select an email to read.</p>
                  )}

                  {selectedEmailId && emailDetailLoading && (
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading email...
                    </div>
                  )}

                  {selectedEmail && (
                    <div>
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h3 className="text-xl font-semibold text-zinc-50">{selectedEmail.subject}</h3>
                          <p className="mt-1 text-sm text-zinc-400">From: {selectedEmail.sender}</p>
                          <p className="text-xs text-zinc-500">{timeAgo(selectedEmail.timestamp)}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={openComposeForReply}
                            className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-xs text-zinc-200 hover:bg-white/5"
                          >
                            <Reply className="h-3.5 w-3.5" />
                            Reply
                          </button>
                          <button
                            type="button"
                            onClick={() => runEmailAction(selectedEmail.unread ? 'markRead' : 'markUnread')}
                            disabled={emailActionLoading}
                            className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-xs text-zinc-200 hover:bg-white/5 disabled:opacity-60"
                          >
                            {selectedEmail.unread ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock3 className="h-3.5 w-3.5" />}
                            {selectedEmail.unread ? 'Mark Read' : 'Mark Unread'}
                          </button>
                          <button
                            type="button"
                            onClick={() => runEmailAction('archive')}
                            disabled={emailActionLoading}
                            className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-xs text-zinc-200 hover:bg-white/5 disabled:opacity-60"
                          >
                            <Archive className="h-3.5 w-3.5" />
                            Archive
                          </button>
                        </div>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                        <pre className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-200">{selectedEmail.text || selectedEmail.snippet}</pre>
                      </div>
                    </div>
                  )}
                </>
              )}

              {emailPanelView === 'contacts' && (
                <>
                  {!selectedContact && (
                    <p className="text-sm text-zinc-500">Select a contact to view details.</p>
                  )}

                  {selectedContact && (
                    <div>
                      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-xl font-semibold text-zinc-50">{selectedContact.name}</h3>
                          <p className="mt-1 text-sm text-zinc-300">{selectedContact.email}</p>
                          <p className="mt-1 text-xs text-zinc-500">{selectedContact.company || 'No company set'}</p>
                        </div>
                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-zinc-300">
                          {selectedContact.category || 'Other'}
                        </span>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-300">
                        <p><span className="text-zinc-500">Phone:</span> {selectedContact.phone || '—'}</p>
                        <p className="mt-2"><span className="text-zinc-500">Last emailed:</span> {selectedContact.last_emailed ? timeAgo(selectedContact.last_emailed) : 'never'}</p>
                        <p className="mt-2"><span className="text-zinc-500">Created:</span> {timeAgo(selectedContact.created_at)}</p>
                        {selectedContact.notes ? <p className="mt-3 text-zinc-400">{selectedContact.notes}</p> : null}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openComposeForContact(selectedContact)}
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-200 hover:bg-emerald-500/20"
                        >
                          <Send className="h-3.5 w-3.5" />
                          Send Email
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditContact(selectedContact)}
                          className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-200 hover:bg-white/5"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteContact(selectedContact.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-400/30 px-3 py-1.5 text-xs text-rose-300 hover:bg-rose-500/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </article>
          </section>
        )}

        {activeView === 'contacts' && (
          <section className="grid min-h-[70vh] grid-cols-1 gap-4 xl:grid-cols-[1.25fr_0.75fr]">
            <article className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <Mail className="h-4 w-4 text-sky-300" />
                  Contacts
                </h2>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={openCreateContact}
                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-200 hover:bg-emerald-500/20"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Contact
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportModalOpen(true)}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-200 hover:bg-white/5"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Import CSV
                  </button>
                  <button
                    type="button"
                    onClick={fetchContacts}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/5"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${contactsLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>
              </div>

              <div className="mb-4 flex flex-wrap gap-3">
                <input
                  value={contactSearch}
                  onChange={(event) => setContactSearch(event.target.value)}
                  placeholder="Search contacts by name or email..."
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 md:w-80"
                />
                <select
                  value={contactCategory}
                  onChange={(event) => setContactCategory(event.target.value)}
                  className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100"
                >
                  {CONTACT_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {contactsError && <p className="mb-3 text-sm text-rose-300">{contactsError}</p>}

              <div className="grid gap-3 md:grid-cols-2">
                {filteredContacts.map((contact) => (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => setSelectedContactId(contact.id)}
                    className={`rounded-xl border p-3 text-left transition ${
                      selectedContactId === contact.id
                        ? 'border-emerald-400/40 bg-emerald-500/10'
                        : 'border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/5'
                    }`}
                  >
                    <p className="truncate text-sm font-semibold text-zinc-100">{contact.name}</p>
                    <p className="mt-1 truncate text-xs text-zinc-400">{contact.email}</p>
                    <p className="mt-1 truncate text-xs text-zinc-500">{contact.company || 'No company'}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-zinc-300">
                        {contact.category || 'Other'}
                      </span>
                      <span className="text-[11px] text-zinc-600">{timeAgo(contact.created_at)}</span>
                    </div>
                  </button>
                ))}

                {!contactsLoading && filteredContacts.length === 0 && (
                  <p className="rounded-lg border border-dashed border-white/10 px-3 py-5 text-sm text-zinc-500">
                    No contacts found.
                  </p>
                )}
              </div>
            </article>

            <article className="rounded-2xl border border-white/10 bg-black/30 p-4">
              {!selectedContact && (
                <p className="text-sm text-zinc-500">Select a contact to see details and quick actions.</p>
              )}

              {selectedContact && (
                <div>
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-semibold text-zinc-50">{selectedContact.name}</h3>
                      <p className="mt-1 text-sm text-zinc-300">{selectedContact.email}</p>
                      <p className="mt-1 text-xs text-zinc-500">{selectedContact.company || 'No company set'}</p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-zinc-300">
                      {selectedContact.category || 'Other'}
                    </span>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-300">
                    <p><span className="text-zinc-500">Phone:</span> {selectedContact.phone || '—'}</p>
                    <p className="mt-2"><span className="text-zinc-500">Last emailed:</span> {selectedContact.last_emailed ? timeAgo(selectedContact.last_emailed) : 'never'}</p>
                    <p className="mt-2"><span className="text-zinc-500">Created:</span> {timeAgo(selectedContact.created_at)}</p>
                    {selectedContact.notes ? <p className="mt-3 text-zinc-400">{selectedContact.notes}</p> : null}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => openComposeForContact(selectedContact)}
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-200 hover:bg-emerald-500/20"
                    >
                      <Send className="h-3.5 w-3.5" />
                      Send Email
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditContact(selectedContact)}
                      className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-200 hover:bg-white/5"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteContact(selectedContact.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-400/30 px-3 py-1.5 text-xs text-rose-300 hover:bg-rose-500/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </article>
          </section>
        )}

        {activeView === 'keys' && (
          <section className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Shield className="h-4 w-4 text-amber-300" />
                API Key Vault
              </h2>
              <button
                type="button"
                onClick={openCreateKey}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/20 px-3 py-1.5 text-sm text-emerald-200 ring-1 ring-emerald-400/30 hover:bg-emerald-500/30"
              >
                <Plus className="h-4 w-4" />
                Add Key
              </button>
            </div>

            <div className="mb-4 flex flex-wrap gap-3">
              <input
                value={keySearch}
                onChange={(event) => setKeySearch(event.target.value)}
                placeholder="Search keys..."
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 md:w-72"
              />
              <select
                value={keyCategory}
                onChange={(event) => setKeyCategory(event.target.value)}
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100"
              >
                {KEY_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={fetchKeys}
                className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-300 hover:bg-white/5"
              >
                <RefreshCw className={`h-4 w-4 ${keysLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {keysError && <p className="mb-3 text-sm text-rose-300">{keysError}</p>}

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {keys.map((item) => {
                const revealed = revealedKeys[item.id];

                return (
                  <article key={item.id} className="rounded-xl border border-white/10 bg-black/25 p-4">
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div>
                        <p className="text-base font-semibold text-zinc-100">{item.service}</p>
                        <p className="text-xs text-zinc-500">{item.name}</p>
                      </div>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-zinc-300">
                        {item.category}
                      </span>
                    </div>

                    <p className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 font-medium text-zinc-200">
                      {revealed || item.key_masked}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => (revealed ? setRevealedKeys((prev) => {
                          const next = { ...prev };
                          delete next[item.id];
                          return next;
                        }) : revealKey(item.id))}
                        className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-xs text-zinc-200 hover:bg-white/5"
                      >
                        {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        {revealed ? 'Hide' : 'Reveal'}
                      </button>
                      <button
                        type="button"
                        onClick={() => copyValue(revealed || item.key_masked)}
                        className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-xs text-zinc-200 hover:bg-white/5"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Copy
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditKey(item)}
                        className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-xs text-zinc-200 hover:bg-white/5"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteKey(item.id)}
                        className="inline-flex items-center gap-1 rounded-md border border-rose-400/30 px-2 py-1 text-xs text-rose-300 hover:bg-rose-500/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>

                    <div className="mt-3 text-xs text-zinc-500">
                      <p>Created: {timeAgo(item.created_at)}</p>
                      <p>Last used: {item.last_used ? timeAgo(item.last_used) : 'never'}</p>
                      {item.notes ? <p className="mt-1 text-zinc-400">{item.notes}</p> : null}
                    </div>
                  </article>
                );
              })}

              {!keysLoading && keys.length === 0 && (
                <p className="rounded-lg border border-dashed border-white/10 px-3 py-4 text-sm text-zinc-500">
                  No keys found for current filter.
                </p>
              )}
            </div>
          </section>
        )}
      </div>

      {composeOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0b1220] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-50">Compose Email</h3>
              <button
                type="button"
                onClick={() => {
                  setComposeOpen(false);
                  setComposeForm(EMPTY_COMPOSE_FORM);
                  setComposeToFocused(false);
                }}
                className="rounded-lg border border-white/10 p-1.5 text-zinc-400 hover:bg-white/5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <input
                  value={composeForm.to}
                  onFocus={() => setComposeToFocused(true)}
                  onBlur={() => {
                    setTimeout(() => setComposeToFocused(false), 120);
                  }}
                  onChange={(event) => setComposeForm((prev) => ({ ...prev, to: event.target.value }))}
                  placeholder="To"
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
                />
                {composeToFocused && composeContactSuggestions.length > 0 && (
                  <div className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-white/10 bg-[#0a0f1c] p-1">
                    {composeContactSuggestions.map((contact) => (
                      <button
                        key={contact.id}
                        type="button"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          setComposeForm((prev) => ({ ...prev, to: contact.email }));
                          setComposeToFocused(false);
                        }}
                        className="w-full rounded-md px-2 py-1.5 text-left hover:bg-white/5"
                      >
                        <p className="truncate text-xs text-zinc-100">{contact.name}</p>
                        <p className="truncate text-[11px] text-zinc-500">{contact.email}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <input
                value={composeForm.subject}
                onChange={(event) => setComposeForm((prev) => ({ ...prev, subject: event.target.value }))}
                placeholder="Subject"
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
              />
              <textarea
                value={composeForm.body}
                onChange={(event) => setComposeForm((prev) => ({ ...prev, body: event.target.value }))}
                placeholder="Message"
                rows={10}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
              />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setComposeOpen(false);
                  setComposeForm(EMPTY_COMPOSE_FORM);
                  setComposeToFocused(false);
                }}
                className="rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-300 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={sendEmail}
                disabled={composeSending}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
              >
                {composeSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {contactModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#0b1220] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-50">{editingContact ? 'Edit Contact' : 'Add Contact'}</h3>
              <button
                type="button"
                onClick={() => {
                  setContactModalOpen(false);
                  setEditingContact(null);
                  setContactForm(EMPTY_CONTACT_FORM);
                }}
                className="rounded-lg border border-white/10 p-1.5 text-zinc-400 hover:bg-white/5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <input
                value={contactForm.name}
                onChange={(event) => setContactForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Name"
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
              />
              <input
                value={contactForm.email}
                onChange={(event) => setContactForm((prev) => ({ ...prev, email: event.target.value }))}
                placeholder="Email"
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
              />
              <input
                value={contactForm.company}
                onChange={(event) => setContactForm((prev) => ({ ...prev, company: event.target.value }))}
                placeholder="Company"
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
              />
              <input
                value={contactForm.phone}
                onChange={(event) => setContactForm((prev) => ({ ...prev, phone: event.target.value }))}
                placeholder="Phone"
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
              />
              <select
                value={contactForm.category}
                onChange={(event) => setContactForm((prev) => ({ ...prev, category: event.target.value }))}
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
              >
                {CONTACT_CATEGORIES.filter((category) => category !== 'All').map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <input
                value={contactForm.notes}
                onChange={(event) => setContactForm((prev) => ({ ...prev, notes: event.target.value }))}
                placeholder="Notes (optional)"
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
              />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setContactModalOpen(false);
                  setEditingContact(null);
                  setContactForm(EMPTY_CONTACT_FORM);
                }}
                className="rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-300 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitContactForm}
                disabled={contactSaving}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
              >
                {contactSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {importModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#0b1220] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-50">Import Contacts (CSV)</h3>
              <button
                type="button"
                onClick={() => {
                  setImportModalOpen(false);
                  setImportCsvValue('');
                }}
                className="rounded-lg border border-white/10 p-1.5 text-zinc-400 hover:bg-white/5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mb-3 text-xs text-zinc-500">Paste one row per line in format: <span className="text-zinc-300">name,email</span></p>
            <textarea
              value={importCsvValue}
              onChange={(event) => setImportCsvValue(event.target.value)}
              placeholder={'Jane Doe,jane@company.com\\nJohn Smith,john@fund.com'}
              rows={10}
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
            />

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setImportModalOpen(false);
                  setImportCsvValue('');
                }}
                className="rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-300 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={importContacts}
                disabled={importingContacts}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
              >
                {importingContacts ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Import
              </button>
            </div>
          </div>
        </div>
      )}

      {keyModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#0b1220] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-50">{editingKey ? 'Edit API Key' : 'Add API Key'}</h3>
              <button
                type="button"
                onClick={() => {
                  setKeyModalOpen(false);
                  setEditingKey(null);
                  setKeyForm(EMPTY_KEY_FORM);
                }}
                className="rounded-lg border border-white/10 p-1.5 text-zinc-400 hover:bg-white/5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <input
                value={keyForm.service}
                onChange={(event) => setKeyForm((prev) => ({ ...prev, service: event.target.value }))}
                placeholder="Service name"
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
              />
              <input
                value={keyForm.name}
                onChange={(event) => setKeyForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Key name"
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
              />
              <input
                value={keyForm.keyValue}
                onChange={(event) => setKeyForm((prev) => ({ ...prev, keyValue: event.target.value }))}
                placeholder={editingKey ? 'Leave blank to keep current value' : 'Key value'}
                className="md:col-span-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
              />
              <select
                value={keyForm.category}
                onChange={(event) => setKeyForm((prev) => ({ ...prev, category: event.target.value }))}
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
              >
                {KEY_CATEGORIES.filter((category) => category !== 'All').map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <input
                value={keyForm.notes}
                onChange={(event) => setKeyForm((prev) => ({ ...prev, notes: event.target.value }))}
                placeholder="Notes (optional)"
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
              />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setKeyModalOpen(false);
                  setEditingKey(null);
                  setKeyForm(EMPTY_KEY_FORM);
                }}
                className="rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-300 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitKeyForm}
                disabled={keySaving}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
              >
                {keySaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
