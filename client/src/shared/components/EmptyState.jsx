import { FiArrowRight } from 'react-icons/fi'

export function EmptyState({ icon: Icon, title, text, action, onAction }) {
  return <div className="flex min-h-56 flex-col items-center justify-center px-5 py-10 text-center"><span className="grid size-11 place-items-center rounded-xl bg-soft text-muted dark:bg-night-soft"><Icon size={19} /></span><h2 className="mt-4 font-display text-base font-bold">{title}</h2><p className="mt-1 max-w-sm text-sm leading-6 text-muted">{text}</p>{action && <button onClick={onAction} className="secondary-button mt-4">{action}<FiArrowRight size={15} /></button>}</div>
}
