import ConnectionPowerMarkdownId from '../assets/documentation/id/inputform/ConnectionPower.md'
import ConnectionPowerMarkdownEn from '../assets/documentation/en/inputform/ConnectionPower.md'
import MonthlyBillEn from '../assets/documentation/en/inputform/MonthlyBill.md'
import MonthlyBillId from '../assets/documentation/id/inputform/MonthlyBill.md'
import NumberOfPanelsEn from '../assets/documentation/en/results/NumberOfPanels.md'
import NumberOfPanelsId from '../assets/documentation/id/results/NumberOfPanels.md'
import LocationEn from '../assets/documentation/en/inputform/Location.md'
import LocationId from '../assets/documentation/id/inputform/Location.md'

export enum Documentation {
  ConnectionPower,
  MonthlyBill,
  Location,
  NumberOfPanels
}

export enum Locale {
  Indonesian = 'id',
  English = 'en'
}

function getIndonesian(doc: Documentation): string {
  switch (doc) {
    case Documentation.ConnectionPower: return ConnectionPowerMarkdownId.body
    case Documentation.MonthlyBill: return MonthlyBillId.body
    case Documentation.NumberOfPanels: return NumberOfPanelsId.body
    case Documentation.Location: return LocationId.body
  }
}

function getEnglish(doc: Documentation): string {
  switch (doc) {
    case Documentation.ConnectionPower: return ConnectionPowerMarkdownEn.body
    case Documentation.MonthlyBill: return MonthlyBillEn.body
    case Documentation.NumberOfPanels: return NumberOfPanelsEn.body
    case Documentation.Location: return LocationEn.body
  }
}


export function documentation(locale: Locale, doc: Documentation): string {
  switch (locale) {
    case Locale.Indonesian: return getIndonesian(doc)
    case Locale.English: return getEnglish(doc)
  }
}
