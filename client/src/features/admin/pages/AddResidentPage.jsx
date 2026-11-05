import { useId, useState } from 'react'
import { FiArrowLeft, FiInfo, FiUserPlus } from 'react-icons/fi'

const emptyValues = { name: '', email: '', phone: '', locationId: '', unitNumber: '', occupancy: 'Tenant', householdSize: '1', nextOfKinName: '', nextOfKinPhone: '', nextOfKinEmail: '' }

export function AddResidentPage({ locations, existingHouseholds, onCancel, onCreate }) {
  const id = useId()
  const [values, setValues] = useState(emptyValues)
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const selectedLocation = locations.find((location) => location.id === values.locationId)
  const update = (key, value) => {
    setValues((current) => ({ ...current, [key]: value }))
    if (submitted || errors[key]) setErrors((current) => ({ ...current, [key]: '' }))
  }
  const fieldId = (key) => `${id}-${key}`
  const field = (key, label, placeholder, props = {}) => <div><label htmlFor={fieldId(key)} className="field-label">{label}</label><input id={fieldId(key)} className="form-control" value={values[key]} onChange={(event) => update(key, event.target.value)} aria-invalid={Boolean(errors[key])} aria-describedby={errors[key] ? `${fieldId(key)}-error` : undefined} placeholder={placeholder} {...props} />{errors[key] && <span id={`${fieldId(key)}-error`} className="field-error">{errors[key]}</span>}</div>
  const validate = () => {
    const next = {}
    for (const key of ['name', 'email', 'phone', 'locationId', 'unitNumber', 'nextOfKinName', 'nextOfKinPhone', 'nextOfKinEmail']) if (!String(values[key]).trim()) next[key] = 'This field is required.'
    if (values.email && !/^\S+@\S+\.\S+$/.test(values.email)) next.email = 'Enter a valid email address.'
    if (values.nextOfKinEmail && !/^\S+@\S+\.\S+$/.test(values.nextOfKinEmail)) next.nextOfKinEmail = 'Enter a valid email address.'
    if (!Number.isInteger(Number(values.householdSize)) || Number(values.householdSize) < 1) next.householdSize = 'Household size must be at least one.'
    if (values.locationId && values.unitNumber.trim()) {
      const duplicate = existingHouseholds.some((home) => home.locationId === values.locationId && home.unitNumber?.toLowerCase() === values.unitNumber.trim().toLowerCase())
      if (duplicate) next.unitNumber = 'This household already has a registered member.'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }
  const submit = (event) => {
    event.preventDefault()
    setSubmitted(true)
    if (!validate()) return
    const suffix = crypto.randomUUID().slice(0, 8).toUpperCase()
    onCreate({
      id: `R-${suffix}`,
      name: values.name.trim(),
      email: values.email.trim().toLowerCase(),
      phone: values.phone.trim(),
      locationId: selectedLocation.id,
      location: selectedLocation.name,
      unitNumber: values.unitNumber.trim(),
      unit: `${selectedLocation.name} · ${values.unitNumber.trim()}`,
      occupancy: values.occupancy,
      householdSize: Number(values.householdSize),
      nextOfKin: { name: values.nextOfKinName.trim(), phone: values.nextOfKinPhone.trim(), email: values.nextOfKinEmail.trim() },
      isHouseholdHolder: true,
      accountStatus: 'OTP email pending',
      mustResetPassword: true,
      status: 'Verified',
    })
  }
  return <section className="grid w-full gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
    <form noValidate onSubmit={submit} className="surface-card w-full p-4 sm:p-6">
      <div className="mb-5 border-b border-line pb-4 dark:border-night-line"><h2 className="text-base font-bold">Household registration</h2><p className="mt-1 text-sm text-muted">Register one representative for each household. Include the total number of people living in the home.</p></div>
      <div className="grid gap-4 sm:grid-cols-2">
        {field('name', 'Household representative', 'Full legal name', { autoComplete: 'name', required: true })}
        {field('email', 'Email address', 'name@example.com', { type: 'email', autoComplete: 'email', required: true })}
        {field('phone', 'Phone number', '+254 7XX XXX XXX', { type: 'tel', autoComplete: 'tel', required: true })}
        <div><label htmlFor={fieldId('locationId')} className="field-label">Block or street</label><select id={fieldId('locationId')} className="form-control" value={values.locationId} onChange={(event) => update('locationId', event.target.value)} aria-invalid={Boolean(errors.locationId)} aria-describedby={errors.locationId ? `${fieldId('locationId')}-error` : undefined} required><option value="">Select a location</option>{locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select>{errors.locationId && <span id={`${fieldId('locationId')}-error`} className="field-error">{errors.locationId}</span>}</div>
        {field('unitNumber', 'House or unit number', 'e.g. 08', { required: true })}
        <div><label htmlFor={fieldId('occupancy')} className="field-label">Occupancy</label><select id={fieldId('occupancy')} className="form-control" value={values.occupancy} onChange={(event) => update('occupancy', event.target.value)}><option>Tenant</option><option>Owner</option></select></div>
        {field('householdSize', 'People in household', 'e.g. 4', { type: 'number', min: 1, step: 1, required: true })}
      </div>
      <div className="mb-4 mt-7 border-b border-line pb-3 dark:border-night-line"><h3 className="text-sm font-bold">Next of kin</h3><p className="mt-1 text-xs text-muted">This person can receive household updates and may be promoted by an admin.</p></div>
      <div className="grid gap-4 sm:grid-cols-2">
        {field('nextOfKinName', 'Full name', 'Next of kin name', { required: true })}
        {field('nextOfKinPhone', 'Phone number', '+254 7XX XXX XXX', { type: 'tel', required: true })}
        {field('nextOfKinEmail', 'Email address', 'name@example.com', { type: 'email', required: true })}
      </div>
      <p className="mt-5 flex items-start gap-2 rounded-lg bg-blue-50 px-3 py-2.5 text-xs leading-5 text-blue-900 dark:bg-blue-950/50 dark:text-blue-200"><FiInfo className="mt-0.5 shrink-0" size={15} />Account setup is preview-only. The email service is not connected; when enabled, a one-time password will be sent to the registered email and the first sign-in will require a password reset.</p>
      <div className="mt-6 flex flex-col-reverse gap-2 border-t border-line pt-4 dark:border-night-line sm:flex-row sm:justify-end"><button type="button" className="secondary-button" onClick={onCancel}><FiArrowLeft size={15} />Cancel</button><button type="submit" className="primary-button"><FiUserPlus size={15} />Register household</button></div>
    </form>
    <aside className="surface-card h-fit p-4 sm:p-5"><p className="section-kicker">HOUSEHOLD ACCESS</p><h2 className="mt-2 text-sm font-bold">One account per home</h2><p className="mt-2 text-xs leading-5 text-muted">Check the resident list and location before adding a representative. Only one account can be registered to a household unit.</p>{!locations.length && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-900">Add a block or street before registering a household.</p>}</aside>
  </section>
}
