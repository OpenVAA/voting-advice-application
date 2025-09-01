# Job Management System

The job management system provides a robust way to track long-running admin operations across different features in the OpenVAA admin app.

## Overview

The system consists of:

- **Job Store**: In-memory storage for active and completed jobs
- **Job Controller**: Controller that automatically updates job progress and messages
- **API Endpoints**: REST API for job management
- **UI Components**: Real-time monitoring interface

## Key Features

### 1. Automatic Job Lifecycle Management

- Jobs automatically move from "running" to "completed" or "failed"
- Stale job detection and cleanup
- Memory management with configurable limits

### 2. Real-time Progress Tracking

- Progress updates (0-1 range)
- Info, warning, and error messages
- Automatic timestamp tracking

### 3. Health Monitoring

- System health checks
- Stale job detection
- Automatic cleanup every 5 minutes

### 4. Recovery Mechanisms

- Force-fail individual jobs
- Emergency cleanup for system recovery
- Manual job management

## Usage

### Creating a Job

```typescript
import { createJob } from '$lib/jobs/jobStore';

const jobId = createJob('argument-condensation', 'admin@example.com');
```

### Using JobLogger

```typescript
import { PipelineController } from '$lib/jobs/pipelineLogger';

// Create controller immediately, initialize pipeline later
const controller = new PipelineController(jobId, fetch);

// ... later, when questions are known ...
const pipeline = createQuestionPipeline(supportedQuestions);
controller.initializePipeline(pipeline);

// Example pipeline for 2 questions:
// - question-q1-boolean-pros, question-q1-boolean-cons
// - question-q2-categorical-choice1-pros, question-q2-categorical-choice2-pros, question-q2-categorical-choice3-pros

// Update progress for specific sub-operations
controller.updateSubOperation('data-loading', 1.0); // Complete data loading
controller.updateSubOperation('question-processing', 0.5); // 50% through question processing

// Add messages
await controller.info('Processing question 1');
await controller.warning('Low confidence in answer');
await controller.error('API rate limit exceeded');

// Complete or fail
await controller.complete();
// or
await controller.fail('Error message');
```

### Monitoring Jobs

```typescript
import { getJob, getAllJobs, getSystemHealth } from '$lib/jobs/jobStore';

// Get specific job
const job = getJob(jobId);

// Get all active jobs
const activeJobs = getAllJobs();

// Check system health
const health = getSystemHealth();
```

## API Endpoints

### Core Operations

- `GET /api/admin/jobs` - Get active jobs
- `GET /api/admin/jobs?includePast=true` - Get all jobs (active + past)
- `POST /api/admin/jobs/start` - Start a new job
- `GET /api/admin/jobs/[id]/progress` - Get job progress

### Health & Recovery

- `GET /api/admin/jobs/health` - Get system health
- `POST /api/admin/jobs/emergency-cleanup` - Emergency cleanup
- `POST /api/admin/jobs/[id]/force-fail` - Force fail a job

> **Note**: Job updates (progress, messages, completion) are now handled directly by the job store functions when used within the same process. The PipelineController automatically calls these functions instead of making HTTP requests.

## Configuration

The system uses these constants (configurable in `jobStore.ts`):

```typescript
const JOB_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const JOB_ACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ACTIVE_JOBS = 50;
const MAX_PAST_JOBS = 100;
```

## Recovery from Stuck Jobs

### Automatic Recovery

- Jobs are automatically marked as failed after 30 minutes
- Jobs with no activity for 10 minutes are considered stale
- Cleanup runs every 5 minutes

### Manual Recovery

1. **Individual Job**: Use the "Force Fail" button in the UI
2. **System-wide**: Use the "Emergency Cleanup" button
3. **API**: Call the emergency cleanup endpoint

### Emergency Cleanup

```typescript
import { emergencyCleanup } from '$lib/jobs/jobStore';

const result = emergencyCleanup();
// This will force-fail ALL running jobs and clean up the system
```

## Testing

Run the test script to verify functionality:

```typescript
import { testJobStore, testEmergencyCleanup } from './test-jobStore';

testJobStore();
testEmergencyCleanup();
```

## Best Practices

1. **Always use JobLogger**: Don't manually update jobs, use the controller
2. **Handle errors gracefully**: Use try-catch and call `controller.fail()`
3. **Monitor system health**: Check for stale jobs regularly
4. **Use appropriate timeouts**: Jobs should complete within reasonable time
5. **Clean up resources**: Jobs automatically move to past jobs when done

## Troubleshooting

### Common Issues

1. **Jobs stuck in "running" state**

   - Check system health for stale jobs
   - Use emergency cleanup if needed
   - Verify the job process is actually running

2. **Memory issues**

   - Check past job count
   - Reduce `MAX_PAST_JOBS` if needed
   - Run cleanup manually

3. **UI not updating**
   - Check if jobs are stale
   - Verify API endpoints are working
   - Check browser console for errors

### Debug Commands

```typescript
// Check system health
console.log(getSystemHealth());

// List all jobs
console.log('Active:', getAllJobs());
console.log('Past:', getAllPastJobs());

// Force cleanup
cleanupStaleJobs();
```

## Future Improvements

- Database persistence for jobs
- Job queuing and prioritization
- Distributed job processing
- Job retry mechanisms
- Advanced scheduling
- Metrics and analytics
