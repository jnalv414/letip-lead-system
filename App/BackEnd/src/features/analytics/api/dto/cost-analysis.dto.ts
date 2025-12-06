import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsIn } from 'class-validator';

/**
 * Query parameters for cost-analysis endpoint.
 */
export class CostAnalysisQueryDto {
  @ApiProperty({
    description: 'Grouping for cost breakdown',
    enum: ['service', 'operation', 'daily', 'weekly', 'monthly'],
    default: 'service',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsIn(['service', 'operation', 'daily', 'weekly', 'monthly'])
  groupBy?: 'service' | 'operation' | 'daily' | 'weekly' | 'monthly' = 'service';
}

/**
 * Cost breakdown by service or operation.
 */
export class CostBreakdownItemDto {
  @ApiProperty({
    description: 'Service or operation name',
    example: 'Google Maps (Apify)',
  })
  name: string;

  @ApiProperty({
    description: 'Total cost in USD',
    example: 45.50,
  })
  cost: number;

  @ApiProperty({
    description: 'Number of API calls/operations',
    example: 250,
  })
  operations: number;

  @ApiProperty({
    description: 'Cost per operation in USD',
    example: 0.182,
  })
  costPerOperation: number;

  @ApiProperty({
    description: 'Percentage of total cost',
    example: 35.5,
  })
  percentage: number;
}

/**
 * Time-based cost data point.
 */
export class CostTimeSeriesDto {
  @ApiProperty({
    description: 'Date/period label',
    example: '2025-01-15',
  })
  period: string;

  @ApiProperty({
    description: 'Total cost for this period',
    example: 12.50,
  })
  cost: number;

  @ApiProperty({
    description: 'Cost breakdown by service',
    type: 'object',
    additionalProperties: { type: 'number' },
    example: { apify: 8.50, hunter: 2.00, abstract: 2.00 },
  })
  breakdown: Record<string, number>;
}

/**
 * Budget status information.
 */
export class BudgetStatusDto {
  @ApiProperty({
    description: 'Monthly budget limit',
    example: 500.00,
  })
  monthlyBudget: number;

  @ApiProperty({
    description: 'Current month spend',
    example: 128.50,
  })
  currentSpend: number;

  @ApiProperty({
    description: 'Remaining budget',
    example: 371.50,
  })
  remaining: number;

  @ApiProperty({
    description: 'Percentage of budget used',
    example: 25.7,
  })
  percentUsed: number;

  @ApiProperty({
    description: 'Projected end-of-month spend based on current rate',
    example: 385.50,
  })
  projectedSpend: number;

  @ApiProperty({
    description: 'Whether on track to stay within budget',
    example: true,
  })
  onTrack: boolean;
}

/**
 * Response DTO for GET /api/analytics/cost-analysis.
 *
 * Returns comprehensive cost analysis data.
 */
export class CostAnalysisDto {
  @ApiProperty({
    description: 'Total cost for the period',
    example: 128.50,
  })
  totalCost: number;

  @ApiProperty({
    description: 'Cost breakdown by service/operation',
    type: [CostBreakdownItemDto],
  })
  breakdown: CostBreakdownItemDto[];

  @ApiProperty({
    description: 'Time series cost data (if grouped by time)',
    type: [CostTimeSeriesDto],
    required: false,
  })
  timeSeries?: CostTimeSeriesDto[];

  @ApiProperty({
    description: 'Budget status (if budget tracking enabled)',
    type: BudgetStatusDto,
    required: false,
  })
  budgetStatus?: BudgetStatusDto;

  @ApiProperty({
    description: 'Average cost per lead',
    example: 0.47,
  })
  avgCostPerLead: number;

  @ApiProperty({
    description: 'Total leads (businesses) acquired',
    example: 271,
  })
  totalLeads: number;

  @ApiProperty({
    description: 'Date range for the analysis',
    example: { start: '2025-01-01', end: '2025-01-31' },
  })
  dateRange: {
    start: string;
    end: string;
  };
}
