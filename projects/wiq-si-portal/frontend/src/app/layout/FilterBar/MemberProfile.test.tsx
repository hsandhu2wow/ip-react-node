import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, renderHook, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '../../../test/server'
import { MemberProfile, useMemberProfile, SILHOUETTE_PHOTO } from './MemberProfile'
import type { IMemberProfile } from '../../../features/quick-facts/api/sqf'

const profile: IMemberProfile = {
  email: 'fixture@example.com', first_name: 'Fixture', last_name: 'Manager', phone_number: '',
  profile_photo: 'https://example.com/photo.png', success_factors_role: 'Zone Manager',
}

describe('useMemberProfile (Angular MemberProfileComponent + SqfFilterService.getMemberProfile)', () => {
  let queryClient: QueryClient
  let requests: string[]

  function respond(body: IMemberProfile | null, status = 200) {
    server.use(http.get('*/api/sqf/getTeamMemberArea/:depth/:code', ({ request }) => {
      requests.push(new URL(request.url).pathname.replace('/api', ''))
      return HttpResponse.json(body, { status })
    }))
  }

  function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }

  beforeEach(() => {
    requests = []
    queryClient = new QueryClient()
  })
  afterEach(() => queryClient.clear())

  it('loads the team member for the selected area and falls back to the silhouette photo', async () => {
    respond({ ...profile, profile_photo: '' })
    const { result } = renderHook(() => useMemberProfile({ apiDepth: 3, code: '1234' }, 'SI'), { wrapper })
    await waitFor(() => expect(result.current).not.toBeNull())
    expect(requests).toEqual(['/sqf/getTeamMemberArea/3/1234'])
    expect(result.current?.profile_photo).toBe(SILHOUETTE_PHOTO)
  })

  it.each([
    ['SI', 2, false], ['SI', 3, true], ['SI', 4, true], ['SI', 5, false],
    ['PEL', 1, true], ['PEL', 3, true], ['PEL', 4, false],
    ['BIGW', 1, false], ['BIGW', 2, true], ['BIGW', 3, true], ['BIGW', 4, false],
  ])('%s level %i requests a profile: %s', async (portal, apiDepth, fetches) => {
    respond(profile)
    const { result } = renderHook(() => useMemberProfile({ apiDepth, code: '9' }, portal), { wrapper })
    if (fetches) {
      await waitFor(() => expect(result.current).toEqual(profile))
    } else {
      await new Promise(r => setTimeout(r, 20))
      expect(result.current).toBeNull()
      expect(requests).toEqual([])
    }
  })

  it('stays hidden without a selected area or when the request fails (no retry)', async () => {
    respond(null, 500)
    const { result: none } = renderHook(() => useMemberProfile(null, 'SI'), { wrapper })
    expect(none.current).toBeNull()
    const { result } = renderHook(() => useMemberProfile({ apiDepth: 3, code: '1' }, 'SI'), { wrapper })
    await waitFor(() => expect(requests).toHaveLength(1))
    await new Promise(r => setTimeout(r, 20))
    expect(result.current).toBeNull()
    expect(requests).toHaveLength(1)
  })
})

describe('MemberProfile', () => {
  it('shows the photo, full name, divider and role', () => {
    const { container } = render(<MemberProfile profile={{ ...profile, full_name: 'Fixture Full Name' }} />)
    expect(container.querySelector('img')).toHaveAttribute('src', profile.profile_photo)
    expect(screen.getByText('Fixture Full Name')).toBeInTheDocument()
    expect(screen.queryByText('Fixture Manager')).toBeNull()
    expect(screen.getByText('|').className).toContain('hideXsm')
    expect(screen.getByText('Zone Manager')).toBeInTheDocument()
  })

  it('joins first and last name when there is no full name', () => {
    render(<MemberProfile profile={profile} className="extra" />)
    expect(screen.getByText('Fixture Manager')).toBeInTheDocument()
    expect(screen.getByTestId('member-profile').className).toContain('extra')
  })
})
