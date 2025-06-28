import * as dotenv from 'dotenv';
import * as path from 'path';
import { runMetaEvaluation } from './runMetaEvaluation';

dotenv.config({ path: path.join(__dirname, '../../../../../.env') });
console.log('🔧 Loading environment variables from the path:', path.join(__dirname, '../../../../../.env'));

/**
 * Command-line interface for running meta-evaluation.
 */
async function main() {
  // Get language from command line arguments, default to 'fi'
  const language = process.argv[2] || 'fi';
  
  console.log('OpenVAA Meta-Evaluation Tool');
  console.log('============================');
  console.log(`Language: ${language}`);
  console.log('');
  
  // Check for required environment variables
  const apiKey = process.env.LLM_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('❌ Error: No OpenAI API key found.');
    console.error('Please set one of the following environment variables:');
    console.error('  - LLM_OPENAI_API_KEY');
    console.error('  - OPENAI_API_KEY');
    console.error('');
    console.error('Example:');
    console.error('  export LLM_OPENAI_API_KEY="your-api-key-here"');
    console.error('');
    console.error('Or make sure the .env file in the root directory contains:');
    console.error('  LLM_OPENAI_API_KEY=your-api-key-here');
    process.exit(1);
  }
  
  try {
    // Run meta-evaluation
    const results = await runMetaEvaluation(language);
    
    if (results.length === 0) {
      console.log('❌ No evaluators were successfully tested.');
      process.exit(1);
    }
    
    // Display final ranking
    console.log('\n🏆 FINAL RANKING (by correlation with human judgment):');
    console.log('=====================================================');
    
    const sortedResults = results.sort((a, b) => 
      b.metrics.correlationWithHuman - a.metrics.correlationWithHuman
    );
    
    sortedResults.forEach((result, index) => {
      const rank = index + 1;
      const emoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '  ';
      console.log(`${emoji} ${rank}. ${result.methodName}`);
      console.log(`     Correlation: ${result.metrics.correlationWithHuman.toFixed(3)}`);
      console.log(`     Avg Difference: ${result.metrics.averageDifference.toFixed(2)}`);
      console.log(`     Test Cases: ${result.testResults.length}`);
      console.log('');
    });
    
    // Save results to JSON file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `meta-evaluation-results-${language}-${timestamp}.json`;
    
    const fs = await import('fs/promises');
    await fs.writeFile(filename, JSON.stringify(results, null, 2));
    console.log(`📄 Results saved to: ${filename}`);
    
    console.log('\n✅ Meta-evaluation completed successfully!');
    
  } catch (error) {
    console.error('❌ Error running meta-evaluation:', error instanceof Error ? error.message : error);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure you have set the OpenAI API key');
    console.error('2. Check that evaluator files are properly implemented');
    console.error('3. Verify test data files exist for the specified language');
    console.error('4. Ensure all dependencies are installed');
    process.exit(1);
  }
}

// Run the CLI if this file is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
} 