import { NextRequest, NextResponse } from 'next/server';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EvaluateRequest {
  country_residence: string;
  annual_profit: number;
  business_model: string;
  target_jurisdiction: string;
}

interface EvaluateResponse {
  home_tax_rate: number;
  home_tax_amount: number;
  optimized_tax_rate: number;
  optimized_tax_amount: number;
  net_annual_savings: number;
  recommended_tier: string;
  recommended_package_usd: number;
}

// ---------------------------------------------------------------------------
// Tax rate lookup (mock – replace with live data or database table)
// ---------------------------------------------------------------------------

const HOME_TAX_RATES: Record<string, number> = {
  NL: 0.495,
  DE: 0.475,
  FR: 0.45,
  GB: 0.45,
  US: 0.37,
  CA: 0.33,
  AU: 0.325,
  AE: 0.0,
  SA: 0.0,
  QA: 0.0,
  BH: 0.0,
  KW: 0.0,
  OM: 0.0,
  SG: 0.17,
  HK: 0.165,
  IE: 0.33,
  ES: 0.47,
  IT: 0.43,
  PT: 0.48,
  SE: 0.52,
  BE: 0.5,
  JP: 0.45,
  IN: 0.3,
  BR: 0.34,
  MX: 0.35,
};

const JURISDICTION_TAX_RATES: Record<string, number> = {
  hong_kong: 0.0825,
  singapore: 0.17,
  uae: 0.0,
  saudi_arabia: 0.20,
  qatar: 0.10,
  bahrain: 0.0,
  kuwait: 0.15,
  oman: 0.15,
  delaware_usa: 0.0,
  uk_limited: 0.19,
  estonia_e_residency: 0.0,
  georgia: 0.01,
  cyprus: 0.125,
  malta: 0.05,
  bvi: 0.0,
  cayman: 0.0,
  labuan: 0.03,
};

const TIER_RECOMMENDATIONS: Record<string, { tier: string; package_usd: number }> = {
  hong_kong: { tier: 'tier_2_nominee', package_usd: 3000 },
  singapore: { tier: 'tier_2_nominee', package_usd: 3500 },
  uae: { tier: 'tier_1_fdi', package_usd: 2500 },
  saudi_arabia: { tier: 'tier_1_fdi', package_usd: 4500 },
  qatar: { tier: 'tier_1_fdi', package_usd: 4000 },
  bahrain: { tier: 'tier_1_fdi', package_usd: 3500 },
  kuwait: { tier: 'tier_1_fdi', package_usd: 4000 },
  oman: { tier: 'tier_1_fdi', package_usd: 3500 },
  delaware_usa: { tier: 'tier_3_corporate', package_usd: 4000 },
  uk_limited: { tier: 'tier_2_nominee', package_usd: 3000 },
  estonia_e_residency: { tier: 'tier_1_fdi', package_usd: 2000 },
  georgia: { tier: 'tier_1_fdi', package_usd: 2200 },
  cyprus: { tier: 'tier_2_nominee', package_usd: 3200 },
  malta: { tier: 'tier_3_corporate', package_usd: 4500 },
  bvi: { tier: 'tier_3_corporate', package_usd: 5000 },
  cayman: { tier: 'tier_3_corporate', package_usd: 5500 },
  labuan: { tier: 'tier_2_nominee', package_usd: 2800 },
};

// ---------------------------------------------------------------------------
// POST /api/calculator/evaluate
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as EvaluateRequest;

    const { country_residence, annual_profit, business_model, target_jurisdiction } = body;

    if (!country_residence || !annual_profit || !target_jurisdiction) {
      return NextResponse.json(
        { error: 'Missing required fields: country_residence, annual_profit, target_jurisdiction' },
        { status: 400 }
      );
    }

    if (annual_profit <= 0) {
      return NextResponse.json(
        { error: 'annual_profit must be greater than zero' },
        { status: 400 }
      );
    }

    const countryCode = country_residence.toUpperCase();

    // TODO: Replace with database lookup or external tax API call
    const homeTaxRate = HOME_TAX_RATES[countryCode];
    if (homeTaxRate === undefined) {
      return NextResponse.json(
        { error: `Unsupported country code: ${countryCode}` },
        { status: 400 }
      );
    }

    const optimizedTaxRate = JURISDICTION_TAX_RATES[target_jurisdiction];
    if (optimizedTaxRate === undefined) {
      return NextResponse.json(
        { error: `Unsupported target jurisdiction: ${target_jurisdiction}` },
        { status: 400 }
      );
    }

    const homeTaxAmount = Math.round(annual_profit * homeTaxRate);
    const optimizedTaxAmount = Math.round(annual_profit * optimizedTaxRate);
    const netAnnualSavings = homeTaxAmount - optimizedTaxAmount;

    const recommendation = TIER_RECOMMENDATIONS[target_jurisdiction] ?? {
      tier: 'tier_1_fdi',
      package_usd: 2000,
    };

    const response: EvaluateResponse = {
      home_tax_rate: homeTaxRate,
      home_tax_amount: homeTaxAmount,
      optimized_tax_rate: optimizedTaxRate,
      optimized_tax_amount: optimizedTaxAmount,
      net_annual_savings: netAnnualSavings,
      recommended_tier: recommendation.tier,
      recommended_package_usd: recommendation.package_usd,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[calculator/evaluate] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
