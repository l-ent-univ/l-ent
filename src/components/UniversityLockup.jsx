import universityConfig from '@university'
import lentLogo from '../assets/lent-logo.svg'

const branding = universityConfig.branding
const lockupAlt = branding.sidebarLogoAlt ?? branding.appName

const VARIANTS = {
  sidebar: {
    lockupLight: 'block h-[58px] w-auto dark:hidden',
    lockupDark: 'hidden h-[58px] w-auto dark:block',
    lent: 'block h-[52px] w-auto shrink-0',
    uni: 'block h-[24px] w-auto min-w-0 object-contain dark:invert',
    row: 'inline-flex items-center gap-2 min-w-0',
  },
  header: {
    lockupLight: 'block w-[290px] h-16 object-contain max-xl:w-[180px] max-xl:h-12 max-md:w-[200px] max-md:h-auto dark:hidden',
    lockupDark: 'hidden w-[290px] h-16 object-contain max-xl:w-[180px] max-xl:h-12 max-md:w-[200px] max-md:h-auto dark:block',
    lent: 'block h-16 w-auto shrink-0 object-contain max-xl:h-12 max-md:h-11',
    // The header sits over the hero photo, so the university logo is shown in white.
    uni: 'block h-8 w-auto min-w-0 object-contain max-xl:h-6 [filter:brightness(0)_invert(1)_drop-shadow(0_1px_2px_rgba(0,0,0,0.5))_drop-shadow(0_0_10px_rgba(0,0,0,0.35))]',
    row: 'inline-flex items-center gap-3 min-w-0',
  },
}

// Combined "l'ent × université" logo shown in the sidebar and header.
// A university can ship bespoke artwork (branding.lockup / lockupDark, like
// Rennes); otherwise the l'ent logo and the university logo are composed
// side by side.
function UniversityLockup({ variant = 'sidebar' }) {
  const classes = VARIANTS[variant] ?? VARIANTS.sidebar

  if (branding.lockup) {
    return (
      <>
        <img src={branding.lockup} alt={lockupAlt} className={classes.lockupLight} />
        <img src={branding.lockupDark ?? branding.lockup} alt={lockupAlt} className={classes.lockupDark} />
      </>
    )
  }

  return (
    <span className={classes.row}>
      <img src={lentLogo} alt="L'ent" className={classes.lent} />
      {branding.logo ? (
        <img src={branding.logo} alt={lockupAlt} className={classes.uni} />
      ) : null}
    </span>
  )
}

export default UniversityLockup
