import type { IUserDetails } from '../../shared/api/users'
import { buildNavGroups } from './navItems'

export const fullAccessUser: IUserDetails = {
  name: 'Alex Example',
  email: 'alex@example.invalid',
  success_factors_role: 'Store Manager',
  profile_photo: '',
  switch_account_url: 'https://accounts.example.invalid/switch',
  logoutUrl: 'https://accounts.example.invalid/logout',
  portal: 'SI',
  new_tags: ['quick_facts', 'quick_assist', 'weekly_facts'],
  sqf: 1, sqf_enabled: true, sqa: 1, quick_assist_enabled: 1, wf: 1,
  weekly_facts_enabled: 1, my_plan_enabled: 1, bqf: 1, admin: 1,
  psf: 1, psf_enabled: 1, act: 1,
}

export const fullAccessNavGroups = buildNavGroups(
  fullAccessUser,
  false,
  'SI',
  true,
)

export const fullAccessNavResult = {
  groups: fullAccessNavGroups,
  user: fullAccessUser,
  dashboardSettingsError: false,
}
