import { useEffect, useState } from 'react'
import { FiArrowLeft, FiSave } from 'react-icons/fi'
import { api } from '../../../api.js'

const eventList = [
  ['ACCOUNT_REGISTERED', 'Registration received'], ['ACCOUNT_APPROVED', 'Resident registration approved'], ['PASSWORD_UPDATED', 'Password updated'], ['SUPPORT_CREATED', 'Support request received'], ['SUPPORT_UPDATED', 'Support request updated'], ['ISSUE_REPORT_CREATED', 'New issue report received'], ['ISSUE_REPORT_UPDATED', 'Issue report updated'],
  ['MARKETPLACE_LISTING_SUBMITTED', 'Marketplace listing submitted'], ['MARKETPLACE_LISTING_APPROVED', 'New marketplace item approved'], ['CAMPAIGN_CREATED', 'Campaign submitted for committee review'], ['CAMPAIGN_DECISION', 'Campaign review decision'], ['CAMPAIGN_PUBLISHED', 'Campaign approved and published'], ['ELECTION_CREATED', 'Election opened'], ['ELECTION_COMPLETED', 'Election completed'],
]

const blank = { emailEnabled: false, smtpHost: '', smtpPort: 587, smtpSecure: false, smtpUsername: '', smtpPassword: '', emailFromName: '', emailFromAddress: '', whatsappEnabled: false, whatsappPhoneNumberId: '', whatsappAccessToken: '', whatsappApiVersion: 'v25.0', whatsappLanguage: 'en', eventSettings: {} }

export function PlatformCommunicationsPage({ estate, onBack, onSaved }) {
  const [form, setForm] = useState(blank)
  const [hasSmtpPassword, setHasSmtpPassword] = useState(false)
  const [hasWhatsappAccessToken, setHasWhatsappAccessToken] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let active = true
    api.getEstateCommunications(estate.id).then(({ settings }) => {
      if (!active || !settings) return
      const { hasSmtpPassword: hasEmailSecret, hasWhatsappAccessToken: hasWhatsAppSecret, ...values } = settings
      setForm({ ...blank, ...values, smtpPassword: '', whatsappAccessToken: '' })
      setHasSmtpPassword(hasEmailSecret)
      setHasWhatsappAccessToken(hasWhatsAppSecret)
    }).catch((requestError) => { if (active) setError(requestError.message) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [estate.id])

  const setValue = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const setEvent = (event, channel, key, value) => setForm((current) => ({ ...current, eventSettings: { ...current.eventSettings, [event]: { ...current.eventSettings[event], [channel]: { ...current.eventSettings[event]?.[channel], [key]: value } } } }))
  const save = async (event) => {
    event.preventDefault(); setSaving(true); setError(''); setSuccess('')
    try {
      const saved = await api.updateEstateCommunications(estate.id, form)
      setHasSmtpPassword(saved.hasSmtpPassword); setHasWhatsappAccessToken(saved.hasWhatsappAccessToken)
      setForm((current) => ({ ...current, smtpPassword: '', whatsappAccessToken: '' }))
      setSuccess('Estate communication settings saved.')
      onSaved?.()
    } catch (requestError) { setError(requestError.message) } finally { setSaving(false) }
  }

  const textField = (label, key, type = 'text', placeholder = '') => <label className="grid gap-1.5 text-sm"><span className="font-semibold">{label}</span><input className="form-control" type={type} value={form[key] ?? ''} placeholder={placeholder} onChange={(event) => setValue(key, type === 'number' ? Number(event.target.value) : event.target.value)} /></label>
  const toggle = (label, checked, onChange) => <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(checked)} onChange={(event) => onChange(event.target.checked)} /><span>{label}</span></label>

  if (loading) return <section className="surface-card p-6 text-sm text-muted">Loading communication settings…</section>
  return <form onSubmit={save} className="grid gap-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted">Configure messages for <b>{estate.name}</b>. Credentials are encrypted on the server and never shown after saving.</p><button type="button" className="secondary-button" onClick={onBack}><FiArrowLeft size={15} />Back to estates</button></div>
    {error && <p className="field-error" role="alert">{error}</p>}{success && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800 dark:bg-green-950/30 dark:text-green-200" role="status">{success}</p>}
    <section className="surface-card grid gap-4 p-5 sm:p-6"><div className="flex items-center justify-between"><div><h2 className="font-bold">Email via SMTP</h2><p className="mt-1 text-sm text-muted">Use this estate’s email provider and sender details.</p></div>{toggle('Enable email', form.emailEnabled, (value) => setValue('emailEnabled', value))}</div><div className="grid gap-3 sm:grid-cols-2">{textField('SMTP host', 'smtpHost', 'text', 'smtp.example.com')}{textField('Port', 'smtpPort', 'number')}{textField('Username', 'smtpUsername')}{textField(hasSmtpPassword ? 'Password (leave blank to keep saved password)' : 'Password', 'smtpPassword', 'password')}{textField('From name', 'emailFromName')}{textField('From address', 'emailFromAddress', 'email')}</div>{toggle('Use implicit TLS (usually port 465)', form.smtpSecure, (value) => setValue('smtpSecure', value))}</section>
    <section className="surface-card grid gap-4 p-5 sm:p-6"><div className="flex items-center justify-between"><div><h2 className="font-bold">WhatsApp Cloud API</h2><p className="mt-1 text-sm text-muted">Add an approved message template name for each event below.</p></div>{toggle('Enable WhatsApp', form.whatsappEnabled, (value) => setValue('whatsappEnabled', value))}</div><div className="grid gap-3 sm:grid-cols-2">{textField('Phone number ID', 'whatsappPhoneNumberId')}{textField('Graph API version', 'whatsappApiVersion')}{textField(hasWhatsappAccessToken ? 'Access token (leave blank to keep saved token)' : 'Access token', 'whatsappAccessToken', 'password')}{textField('Default language code', 'whatsappLanguage')}</div></section>
    <section className="surface-card grid gap-4 p-5 sm:p-6"><div><h2 className="font-bold">Event messages</h2><p className="mt-1 text-sm text-muted">Email placeholders: {'{name}'}, {'{estate}'}, {'{title}'}, {'{message}'}, {'{url}'}.</p></div>{eventList.map(([event, label]) => { const config = form.eventSettings[event] || {}; return <article key={event} className="grid gap-3 border-t border-line pt-4 dark:border-night-line"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold">{label}</h3>{toggle('Enable event', config.enabled !== false, (value) => setForm((current) => ({ ...current, eventSettings: { ...current.eventSettings, [event]: { ...current.eventSettings[event], enabled: value } } })))}</div><div className="grid gap-3 md:grid-cols-2"><div className="grid gap-2 rounded-lg bg-soft p-3 dark:bg-night-soft">{toggle('Email', config.email?.enabled !== false, (value) => setEvent(event, 'email', 'enabled', value))}<input className="form-control" placeholder="Email subject" value={config.email?.subject || ''} onChange={(e) => setEvent(event, 'email', 'subject', e.target.value)} /><textarea className="form-control min-h-24" placeholder="Email body. Use the placeholders listed above." value={config.email?.body || ''} onChange={(e) => setEvent(event, 'email', 'body', e.target.value)} /></div><div className="grid content-start gap-2 rounded-lg bg-soft p-3 dark:bg-night-soft">{toggle('WhatsApp', config.whatsapp?.enabled !== false, (value) => setEvent(event, 'whatsapp', 'enabled', value))}<input className="form-control" placeholder="Approved WhatsApp template name" value={config.whatsapp?.templateName || ''} onChange={(e) => setEvent(event, 'whatsapp', 'templateName', e.target.value)} /><input className="form-control" placeholder="Template language, e.g. en" value={config.whatsapp?.language || form.whatsappLanguage} onChange={(e) => setEvent(event, 'whatsapp', 'language', e.target.value)} /><p className="text-xs leading-5 text-muted">Template body must accept five text parameters: name, estate, title, summary, and notification URL.</p></div></div></article> })}</section>
    <div className="flex justify-end"><button className="primary-button" disabled={saving}><FiSave size={15} />{saving ? 'Saving…' : 'Save communication settings'}</button></div>
  </form>
}
