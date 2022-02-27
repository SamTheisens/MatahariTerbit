import { InputData } from '../components/InputForm'
import { CALCULATOR_VALUES, OptimizationTarget } from '../constants'

export enum LimitingFactor {
  ConnectionSize = 'ConnectionSize',
  Consumption = 'Consumption',
  MinimumPayment = 'MinimumPayment'
}

export interface ResultData {
  consumptionPerMonthInKwh: number
  taxedPricePerKwh: number
  productionPerMonthInKwh: number
  numberOfPanels: number
  numberOfPanelsFinancial: number
  numberOfPanelsGreen: number
  remainingMonthlyCosts: number
  currentMonthlyCosts: number
  totalSystemCosts: number
  monthlyProfit: number
  yearlyProfit: number
  breakEvenPointInMonths: number
  limitingFactor: LimitingFactor
  projection: ReturnOnInvestment[]
}

const monthsInYear = 12.0

export interface SuggestedPanels {
  limitedByConnection: boolean
  numberOfPanels: number
}

function panelsLimitedByConnection(expectedMonthlyProduction: number, kiloWattHourPerMonthPerPanel: number, kiloWattPeakPerPanel: number, connectionPower: number): SuggestedPanels {
  const numberOfPanelsWithoutConnectionLimit = Math.round(Math.max(0, expectedMonthlyProduction / kiloWattHourPerMonthPerPanel))
  const suggestedCapacity = numberOfPanelsWithoutConnectionLimit * kiloWattPeakPerPanel * 1000
  const installableCapacity = Math.min(suggestedCapacity, connectionPower)
  const suggestedPanels = Math.floor(installableCapacity / kiloWattPeakPerPanel / 1000)

  const limitedByConnection = (suggestedPanels + 1) * kiloWattPeakPerPanel * 1000 > connectionPower
  const numberOfPanels = limitedByConnection ? suggestedPanels : suggestedPanels + 1
  return { limitedByConnection, numberOfPanels }
}

export function calculateResultData({ monthlyCostEstimateInRupiah, connectionPower, pvOut, optimizationTarget }: InputData): ResultData {
  const {
    lowTariff,
    highTariff,
    pricePerPanel,
    kiloWattPeakPerPanel,
    kiloWattHourPerYearPerKWp,
    lossFromInverter
  } = CALCULATOR_VALUES

  const pvOutputInkWhPerkWpPerYear = pvOut
  const yieldPerKWp = (pvOutputInkWhPerkWpPerYear ? pvOutputInkWhPerkWpPerYear : kiloWattHourPerYearPerKWp) * lossFromInverter

  // 4.4 kWh output / per 1 kWp (in Sanur)
  const energyTax = 0.1 + 0.05 //PPN + PPJ
  const taxFactor = 1.0 + energyTax
  const pricePerKwh = connectionPower < 1300 ? lowTariff : highTariff
  const taxedPricePerKwh = pricePerKwh * taxFactor

  const minimalMonthlyConsumption = 40 * (connectionPower / 1000)
  const minimalMonthlyCostsIncludingTax = minimalMonthlyConsumption * 1500.0 * taxFactor

  const kiloWattHourPerMonthPerPanel = yieldPerKWp * kiloWattPeakPerPanel / monthsInYear
  const effectiveCostsPerMonth = monthlyCostEstimateInRupiah - minimalMonthlyCostsIncludingTax
  const requiredMonthlyProduction = effectiveCostsPerMonth / taxedPricePerKwh
  const totalMonthlyConsumption = monthlyCostEstimateInRupiah / taxedPricePerKwh

  const limited = panelsLimitedByConnection(requiredMonthlyProduction, kiloWattHourPerMonthPerPanel, kiloWattPeakPerPanel, connectionPower)

  const potentialMonthlyProduction = monthlyCostEstimateInRupiah / taxedPricePerKwh
  const unlimited = panelsLimitedByConnection(potentialMonthlyProduction, kiloWattHourPerMonthPerPanel, kiloWattPeakPerPanel, connectionPower)

  const numberOfPanels = optimizationTarget === OptimizationTarget.Money ? limited.numberOfPanels : unlimited.numberOfPanels

  const productionPerMonthInKwh = limited.numberOfPanels * kiloWattHourPerMonthPerPanel
  const yieldPerMonthFromPanelsInRupiah = productionPerMonthInKwh * taxedPricePerKwh
  const remainingMonthlyCosts = Math.max(minimalMonthlyCostsIncludingTax, monthlyCostEstimateInRupiah - yieldPerMonthFromPanelsInRupiah)

  const monthlyProfit = monthlyCostEstimateInRupiah - remainingMonthlyCosts
  const yearlyProfit = monthlyProfit * monthsInYear
  const totalSystemCosts = numberOfPanels * pricePerPanel
  const flooredNumberOfPanels = monthlyProfit < 0 ? 0 : numberOfPanels
  const limitingFactor = limited.limitedByConnection && unlimited.limitedByConnection ? LimitingFactor.ConnectionSize : (!limited.limitedByConnection && unlimited.limitedByConnection ? LimitingFactor.Consumption: LimitingFactor.MinimumPayment)


  const range = 25
  const projection: ReturnOnInvestment[] = roiProjection(range, {
    taxedPricePerKwh,
    productionPerMonthInKwh,
    yearlyProfit,
    totalSystemCosts
  })
  const firstMonthAboveZero = roiProjection(range, {
    taxedPricePerKwh,
    productionPerMonthInKwh,
    yearlyProfit,
    totalSystemCosts
  }, monthsInYear).find(x => x.cumulativeProfit > 0)
  const breakEvenPointInMonths = firstMonthAboveZero ? firstMonthAboveZero.index : range

  return {
    consumptionPerMonthInKwh: totalMonthlyConsumption,
    taxedPricePerKwh,
    productionPerMonthInKwh,
    numberOfPanels: flooredNumberOfPanels,
    numberOfPanelsGreen: unlimited.numberOfPanels,
    numberOfPanelsFinancial: limited.numberOfPanels,
    remainingMonthlyCosts,
    currentMonthlyCosts: monthlyCostEstimateInRupiah,
    totalSystemCosts,
    monthlyProfit,
    yearlyProfit,
    projection,
    limitingFactor,
    breakEvenPointInMonths
  }
}

export interface ReturnOnInvestment {
  index: number
  output: number
  tariff: number
  income: number
  cumulativeProfit: number
  pvOutputPercentage: number
  stepSizeInMonths: number
}

interface InvestmentParameters {
  taxedPricePerKwh: number
  productionPerMonthInKwh: number
  yearlyProfit: number
  totalSystemCosts: number
}

export function roiProjection(numberOfYears: number, result: InvestmentParameters, divider: number = 1.0): ReturnOnInvestment[] {
  const years = Array.from(Array(numberOfYears * divider).keys()).map(x => x + 1)

  const electricityPriceInflationRate = 0.05 / divider
  const capacityLossRate = 0.0075 / divider

  const electricityPriceInflation = 1.0 + electricityPriceInflationRate
  const capacityLoss = 1.0 - capacityLossRate
  const lifetimeInverterInYears = CALCULATOR_VALUES.inverterLifetimeInYears
  const priceOfInverter = (result.totalSystemCosts * 0.10)
  const priceOfInverterIndexed = priceOfInverter * Math.pow(electricityPriceInflation, lifetimeInverterInYears)

  const startYear = {
    index: 0,
    tariff: result.taxedPricePerKwh,
    output: result.productionPerMonthInKwh * (monthsInYear / divider),
    income: result.productionPerMonthInKwh * (monthsInYear / divider) * result.taxedPricePerKwh,
    cumulativeProfit: result.yearlyProfit - result.totalSystemCosts,
    pvOutputPercentage: 1.0
  } as ReturnOnInvestment
  return years.reduce((acc, currentValue, currentIndex) => {
    const previous = acc[currentIndex]
    const invertReplacementCosts = currentIndex === (lifetimeInverterInYears * divider) ? priceOfInverterIndexed : 0
    return acc.concat({
      index: currentValue,
      tariff: previous.tariff * electricityPriceInflation,
      output: previous.output * capacityLoss,
      income: previous.income * electricityPriceInflation,
      cumulativeProfit: previous.cumulativeProfit + (previous.income * electricityPriceInflation) - invertReplacementCosts,
      pvOutputPercentage: previous.pvOutputPercentage * capacityLoss,
      stepSizeInMonths: monthsInYear / divider
    } as ReturnOnInvestment)
  }, [startYear])

}


