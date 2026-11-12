import { buildNavGroups } from './navItems'

export const fullAccessNavGroups = buildNavGroups(
  {
    sqf: 1, sqf_enabled: true, sqa: 1, quick_assist_enabled: 1, wf: 1,
    weekly_facts_enabled: 1, my_plan_enabled: 1, bqf: 1, admin: 1, psf: 1, psf_enabled: 1, act: 1,
  },
  false,
  'SI',
)
