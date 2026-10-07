import { Icon } from '@iconify/react'

// Empty-state body of the list-style dashboard cards (failed loads hide the
// card instead).
function WidgetListStatus({ icon, title, body }) {
  return (
    <div className="flex-1 flex flex-col justify-center gap-1 min-w-0 min-h-0">
      <div className="flex items-center gap-[7px] min-w-0">
        <Icon icon={icon} className="w-[18px] h-[18px] shrink-0 opacity-70" aria-hidden="true" />
        <span className="m-0 min-w-0 leading-[1.1] text-base font-bold overflow-hidden text-ellipsis whitespace-nowrap max-md:text-[15px]">{title}</span>
      </div>
      {body ? (
        <p className="m-0 text-sm leading-[1.35] opacity-70 overflow-hidden text-ellipsis whitespace-nowrap" title={body}>{body}</p>
      ) : null}
    </div>
  )
}

export default WidgetListStatus
