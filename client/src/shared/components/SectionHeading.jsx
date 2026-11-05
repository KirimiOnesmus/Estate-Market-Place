import { FiArrowRight } from 'react-icons/fi'

export function SectionHeading({ kicker, title, action, onAction }) {
  return <div className="mb-4 flex items-end justify-between gap-3"><div><p className="section-kicker">{kicker}</p><h2 className="mt-1.5 font-display text-lg font-bold tracking-tight sm:text-xl">{title}</h2></div>{action && <button className="secondary-button" onClick={onAction}>{action}<FiArrowRight size={15} /></button>}</div>
}
