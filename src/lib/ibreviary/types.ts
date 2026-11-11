// Types mirror the upstream JSON exactly as verified against live captures
// (2026-11-11). Every field except day_info can be missing on a given day,
// so most fields are optional.

export type LanguageCode = string

export interface TitleContent {
  title: string
  content: string
}

export interface PrefaceItem {
  time?: string
  title: string
  subtitle?: string
  content: string
}

export interface DayInfo {
  date: string
  title: string
  day_type: string
  day_time: string
  complete?: number
  code?: string
  event?: string[]
}

export interface Saint {
  id: number
  image: string
  name: string
  subtitle: string
  type: string
  text: string
}

export interface BreviaryHours {
  complete?: number
  officeofreadings?: TitleContent
  lauds?: TitleContent
  daytimeprayers?: TitleContent
  vespers?: TitleContent
  compline?: TitleContent
  previouscompline?: TitleContent
}

export interface BreviaryMemory extends Partial<BreviaryHours> {
  title: string
  type: string
  mandatory: number
  saint_id?: number
}

export interface MissalSections {
  complete?: number
  antiphon_and_opening_prayer?: TitleContent
  first_reading?: TitleContent
  responsorial_psalm?: TitleContent
  second_reading?: TitleContent
  gospel_acclamation?: TitleContent
  gospel?: TitleContent
  prayer_of_the_faithful?: TitleContent
  prayer_over_the_gifts?: TitleContent
  preface?: TitleContent
  antiphon_and_prayer_after_communion?: TitleContent
}

export interface Missal extends MissalSections {
  variant?: string
  order?: number
}

export interface MissalMemory extends MissalSections {
  title: string
  type: string
  mandatory?: number
  saint_id?: number
}

export interface Day {
  day_info: DayInfo
  saint?: Saint[]
  breviary?: BreviaryHours
  breviary_memory?: BreviaryMemory[]
  missal?: Missal[]
  missal_memory?: MissalMemory[]
  event?: DayEvent[]
}

export interface DayEvent {
  day_info: {
    date: string
    title: string
    subtitle?: string
    type?: string
  }
  breviary?: BreviaryHours
  missal?: MissalSections
}

export interface LanguageItem {
  code: LanguageCode
  title: string
  direction: 'ltr' | 'rtl'
  color: string
}

export interface ProperItem {
  type: string
  title: Record<string, string | null>
  image?: string
  logo?: string
  home?: number
}

export interface Status {
  languages: { list: LanguageItem[]; last_update: string }
  event_type: { list: ProperItem[]; last_update: string }
  fixed_text: { last_update: string }
  styles?: { last_update: string }
  linked_images?: { last_update: string }
  backgrounds?: { last_update: string | null }
}

export interface FixedTexts {
  languages: {
    missal_ancor_text?: string[]
    readings_title?: string
  }
  missal: {
    order_of_mass: {
      title: string
      introductory_rites?: TitleContent
      eucharistic_liturgy?: TitleContent
      communion_rites?: TitleContent
      communion_rites_celebration?: TitleContent
      concluding_rites?: TitleContent
    }
    preface: { title: string; list: PrefaceItem[] }
    eucharistic_liturgy: { title: string; list: TitleContent[] }
    prayers_of_the_faithful: { title: string; list: TitleContent[] }
    blessing: { title: string; list: TitleContent[] }
  }
  prayers: { type?: string; title: string; content: string; use?: string }[]
  rites: { title: string; content: string }[]
  breviary_special: (Partial<Record<'first_vespers' | 'officeofreadings' | 'lauds' | 'daytimeprayers' | 'vespers' | 'compline', TitleContent>> & { title: string })[]
  missal_special: (Partial<MissalSections> & { title: string; type?: string | null })[]
  last_update: string
}

export interface NotificationContent {
  id: string
  id_notifica: string
  titolo: string
  attivo?: string
  contenuto: string
  link?: string
  link_titolo?: string
  lingua?: string
  browser_html?: string
  browser_link?: string
  last_update?: string
}

export interface ServerNotification {
  id: string
  type: string
  regola_ricorrente?: string
  giorni_frequenza?: string
  solo_una_volta?: string
  sempre_presente_in_home?: string
  last_update?: string
  contenuto_localizzato?: NotificationContent
}

export interface ServerNotifications {
  servizio?: string
  lista_notifiche?: ServerNotification[]
  last_update_ricorrente?: string
  last_istant_id?: number
}

export type HourKey = 'officeofreadings' | 'lauds' | 'daytimeprayers' | 'vespers' | 'compline' | 'previouscompline'

export const HOUR_LABELS: Record<HourKey, string> = {
  officeofreadings: 'Office of Readings',
  lauds: 'Morning Prayer',
  daytimeprayers: 'Daytime Prayer',
  vespers: 'Evening Prayer',
  compline: 'Night Prayer',
  previouscompline: 'Night Prayer (previous day)',
}

// Celebration variants a day offers; the app pages through these in its
// day view (base liturgy, commemorations, optional events).
export interface VariantRef {
  kind: 'base' | 'memory' | 'event'
  index: number
}

export const READING_SECTIONS: { key: keyof MissalSections; label: string }[] = [
  { key: 'antiphon_and_opening_prayer', label: 'Entrance Antiphon and Collect' },
  { key: 'first_reading', label: 'First Reading' },
  { key: 'responsorial_psalm', label: 'Responsorial Psalm' },
  { key: 'second_reading', label: 'Second Reading' },
  { key: 'gospel_acclamation', label: 'Gospel Acclamation' },
  { key: 'gospel', label: 'Gospel' },
  { key: 'prayer_of_the_faithful', label: 'Prayer of the Faithful' },
  { key: 'prayer_over_the_gifts', label: 'Prayer over the Offerings' },
  { key: 'preface', label: 'Preface' },
  { key: 'antiphon_and_prayer_after_communion', label: 'Antiphon and Prayer after Communion' },
]
