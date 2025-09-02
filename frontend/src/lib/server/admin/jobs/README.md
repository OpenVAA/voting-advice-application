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

### 3. Message Management

- Info, warning, and error message tracking
- Automatic message limit enforcement (1000 messages per type)
- Timestamp tracking for all messages

## Usage

### Creating a Job

```typescript
import { createJob } from '$lib/server/admin/jobs/jobStore';

const job = createJob('ArgumentCondensation', 'admin@example.com');
```

### Using PipelineController

```typescript
import { PipelineController } from '$lib/server/admin/jobs/pipelineController';

// Create controller with job ID
const controller = new PipelineController(job.id);

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
controller.info('Processing question 1');
controller.warning('Low confidence in answer');
controller.error('API rate limit exceeded');

// Complete or fail
controller.complete();
// or
controller.fail('Error message');
```

### Monitoring Jobs

```typescript
import { getJob, getActiveJobs, getPastJobs } from '$lib/server/admin/jobs/jobStore';

// Get specific job
const job = getJob(jobId);

// Get all active jobs
const activeJobs = getActiveJobs();

// Get all past jobs
const pastJobs = getPastJobs();
```

## API Endpoints

### Core Operations

- `GET /api/admin/jobs/active` - Get active jobs
- `GET /api/admin/jobs/past` - Get past jobs
- `POST /api/admin/jobs/start` - Start a new job
- `GET /api/admin/jobs/single/[id]/progress` - Get job progress

### Job Control

- `POST /api/admin/jobs/single/[id]/abort` - Request job abort
- `POST /api/admin/jobs/abort-all` - Abort all running jobs

> **Note**: Job updates (progress, messages, completion) are now handled directly by the job store functions when used within the same process. The PipelineController automatically calls these functions instead of making HTTP requests.

## Configuration

The system uses constants from `shared.ts`:

```typescript
import { DEFAULT_MAX_MESSAGES, DEFAULT_MESSAGES_HEIGHT } from './shared';

// Message limits per job (info, warning, error)
DEFAULT_MAX_MESSAGES = 1000;

// UI message container height
DEFAULT_MESSAGES_HEIGHT = 'max-h-64';
```

## Job Lifecycle

Jobs progress through these states:

- `running` - Job is actively processing
- `aborting` - Abort requested, job cleaning up
- `completed` - Job finished successfully
- `failed` - Job encountered an error
- `aborted` - Job was cancelled

## Best Practices

1. **Use PipelineController**: Don't manually update jobs, use the controller
2. **Handle errors gracefully**: Use try-catch and call `controller.fail()`
3. **Update progress regularly**: Keep users informed of job status
4. **Check abort status**: Respect user cancellation requests with `isAbortRequested()`
5. **Clean messaging**: Jobs automatically move to past jobs when completed
