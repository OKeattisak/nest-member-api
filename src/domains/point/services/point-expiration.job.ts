import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PointService, ExpirationProcessingResult } from './point.service';

@Injectable()
export class PointExpirationJob {
  private readonly logger = new Logger(PointExpirationJob.name);
  private isProcessing = false;

  constructor(private readonly pointService: PointService) {}

  /**
   * Scheduled job that runs daily at midnight to process expired points
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    name: 'point-expiration',
    timeZone: 'UTC',
  })
  async handlePointExpiration(): Promise<void> {
    if (this.isProcessing) {
      this.logger.warn('Point expiration job is already running, skipping this execution');
      return;
    }

    this.isProcessing = true;
    const startTime = Date.now();

    try {
      this.logger.log('Starting scheduled point expiration job');
      
      const result = await this.pointService.processExpiredPoints();
      
      const duration = Date.now() - startTime;
      
      this.logger.log(
        `Point expiration job completed successfully in ${duration}ms. ` +
        `Points expired: ${result.totalPointsExpired}, ` +
        `Members affected: ${result.membersAffected}, ` +
        `Errors: ${result.errors.length}`
      );

      if (result.errors.length > 0) {
        this.logger.warn('Point expiration job completed with errors:', result.errors);
      }

      // Log detailed metrics for monitoring
      this.logExpirationMetrics(result, duration);

    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Point expiration job failed after ${duration}ms:`, error);
      
      // In a production environment, you might want to send alerts here
      // await this.alertingService.sendAlert('Point expiration job failed', error);
      
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Manual trigger for point expiration processing (for admin use)
   */
  async triggerManualExpiration(): Promise<ExpirationProcessingResult> {
    if (this.isProcessing) {
      throw new Error('Point expiration job is already running');
    }

    this.logger.log('Manual point expiration triggered');
    
    this.isProcessing = true;
    const startTime = Date.now();

    try {
      const result = await this.pointService.processExpiredPoints();
      
      const duration = Date.now() - startTime;
      
      this.logger.log(
        `Manual point expiration completed in ${duration}ms. ` +
        `Points expired: ${result.totalPointsExpired}, ` +
        `Members affected: ${result.membersAffected}`
      );

      return result;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Manual point expiration failed after ${duration}ms:`, error);
      throw error;
      
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Get job status information
   */
  getJobStatus(): { isProcessing: boolean; lastRun?: Date } {
    return {
      isProcessing: this.isProcessing,
      // In a real implementation, you might store the last run time in a database
      // lastRun: this.lastRunTime,
    };
  }

  /**
   * Check for points expiring soon (for proactive notifications)
   */
  async checkExpiringPoints(days: number = 7): Promise<void> {
    try {
      const expiringPoints = await this.pointService.getExpiringPoints(days);
      
      if (expiringPoints.length > 0) {
        this.logger.log(`Found ${expiringPoints.length} points expiring within ${days} days`);
        
        // Group by member for notification purposes
        const memberPointsMap = new Map<string, typeof expiringPoints>();
        
        for (const point of expiringPoints) {
          if (!memberPointsMap.has(point.memberId)) {
            memberPointsMap.set(point.memberId, []);
          }
          memberPointsMap.get(point.memberId)!.push(point);
        }

        // Log summary for each member
        for (const [memberId, points] of memberPointsMap.entries()) {
          const totalAmount = points.reduce((sum, p) => sum + p.amount, 0);
          this.logger.debug(
            `Member ${memberId} has ${points.length} points (${totalAmount} total) expiring within ${days} days`
          );
        }

        // In a production environment, you might want to send notifications here
        // await this.notificationService.sendExpirationWarnings(memberPointsMap);
      }
      
    } catch (error) {
      this.logger.error('Failed to check expiring points:', error);
    }
  }

  /**
   * Scheduled job to check for points expiring soon (runs weekly)
   */
  @Cron(CronExpression.EVERY_WEEK, {
    name: 'expiring-points-check',
    timeZone: 'UTC',
  })
  async handleExpiringPointsCheck(): Promise<void> {
    this.logger.log('Running weekly expiring points check');
    await this.checkExpiringPoints(7); // Check for points expiring in 7 days
  }

  private logExpirationMetrics(result: ExpirationProcessingResult, duration: number): void {
    // Log structured metrics for monitoring systems
    const metrics = {
      job: 'point-expiration',
      duration_ms: duration,
      points_expired: result.totalPointsExpired,
      members_affected: result.membersAffected,
      errors_count: result.errors.length,
      success: result.errors.length === 0,
      timestamp: new Date().toISOString(),
    };

    this.logger.log('Point expiration metrics:', JSON.stringify(metrics));
  }
}