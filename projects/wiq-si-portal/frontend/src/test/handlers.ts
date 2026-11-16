import { http, HttpResponse } from 'msw'
import fixture from './fixtures/sqf-api.sanitized.json'

export const handlers = [
  http.get('*/api/sqf/getUniversalFilterGeneric', () => HttpResponse.json(fixture.hierarchy)),
  http.get('*/api/sqf/getSQFMetricCardsStatus', () => HttpResponse.json(fixture.status)),
  http.get('*/api/sqf/summaryCards/:depth/:date/:code?', () => HttpResponse.json(fixture.summary)),
]
