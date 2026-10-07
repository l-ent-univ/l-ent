import { Icon } from '@iconify/react'

// Empty / error body of the list-style dashboard cards. Pass `onRetry` to
// show the "Réessayer" button and `openLabel` to hint that the card itself
// still opens the service.
function WidgetListStatus({ icon, title, body, onRetry, openLabel }) {
  return (
    <div className="flex-1 flex flex-col justify-center gap-1 min-w-0 min-h-0">
      <div className="flex items-center gap-[7px] min-w-0">
        <Icon icon={icon} className="w-[18px] h-[18px] shrink-0 opacity-70" aria-hidden="true" />
        <span className="m-0 min-w-0 leading-[1.1] text-base font-bold overflow-hidden text-ellipsis whitespace-nowrap max-md:text-[15px]">{title}</span>
      </div>
      {body ? (
        <p className="m-0 text-sm leading-[1.35] opacity-70 overflow-hidden text-ellipsis whitespace-nowrap" title={body}>{body}</p>
      ) : null}
      {onRetry ? (
        <div className="flex items-center gap-2 min-w-0 mt-0.5">
          <button
            type="button"
            className="inline-flex items-center gap-[5px] min-h-[26px] px-[10px] border border-border-input rounded-full bg-bg-input text-text text-[13px] font-semibold leading-none cursor-pointer transition-[background-color] duration-[120ms] ease-in-out hover:bg-bg-subtle"
            onClick={(event) => {
              event.stopPropagation()
              onRetry()
            }}
          >
            <Icon icon="carbon:restart" className="w-[13px] h-[13px] shrink-0" aria-hidden="true" />
            Réessayer
          </button>
          {openLabel ? (
            <span className="inline-flex items-center gap-1 min-w-0 text-[13px] font-semibold opacity-80 whitespace-nowrap overflow-hidden text-ellipsis">
              {openLabel}
              <Icon icon="carbon:arrow-up-right" className="w-[13px] h-[13px] shrink-0" aria-hidden="true" />
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export default WidgetListStatus
