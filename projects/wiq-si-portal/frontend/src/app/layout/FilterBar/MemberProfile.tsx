import { useQuery } from '@tanstack/react-query'
import { getTeamMemberArea, type IMemberProfile } from '../../../features/quick-facts/api/sqf'
import styles from './MemberProfile.module.scss'

export const SILHOUETTE_PHOTO = 'https://ssl.gstatic.com/s2/profiles/images/silhouette200.png'

const LEVEL_RANGE_BY_PORTAL: Record<string, { min: number; max: number }> = {
  PEL: { min: 1, max: 3 },
  BIGW: { min: 2, max: 3 },
}

/** Angular MemberProfileComponent.isZoneOrStateOrGroupLevel */
function isZoneOrStateOrGroupLevel(level: number, portal: string): boolean {
  const { min, max } = LEVEL_RANGE_BY_PORTAL[portal] ?? { min: 3, max: 4 }
  return level >= min && level <= max
}

/**
 * Angular's eligible manager levels include Store: SI 4, METRO/PEL/BIGW 3.
 * Hide the profile outside the eligible range or when the request fails.
 */
export function useMemberProfile(
  node: { apiDepth: number; code: string } | null | undefined,
  portal: string,
): IMemberProfile | null {
  const enabled = !!node && isZoneOrStateOrGroupLevel(node.apiDepth, portal)
  const { data } = useQuery({
    queryKey: ['sqf', 'member-profile', node?.apiDepth, node?.code],
    queryFn: () => getTeamMemberArea(node!.apiDepth, node!.code),
    select: (profile: IMemberProfile) => ({ ...profile, profile_photo: profile.profile_photo || SILHOUETTE_PHOTO }),
    enabled,
    retry: false,
    staleTime: Infinity,
  })
  return enabled && data ? data : null
}

export function MemberProfile({ profile, className = '' }: { profile: IMemberProfile; className?: string }) {
  return (
    <div className={`${styles.memberProfile} ${className}`} data-testid="member-profile">
      <img src={profile.profile_photo} alt="" />
      <div className={styles.details}>
        <div className={styles.name}>{profile.full_name || `${profile.first_name} ${profile.last_name}`}</div>
        <span className={styles.hideXsm}>|</span>
        <div className={styles.others}>{profile.success_factors_role}</div>
      </div>
    </div>
  )
}
