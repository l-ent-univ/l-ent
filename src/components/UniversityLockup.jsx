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
    lent: 'block h-11 w-auto shrink-0 object-contain max-md:h-[34px]',
    uni: 'block h-7 w-auto min-w-0 object-contain max-md:h-6 dark:invert',
    row: 'inline-flex items-center gap-2.5 min-w-0 max-md:gap-2',
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
