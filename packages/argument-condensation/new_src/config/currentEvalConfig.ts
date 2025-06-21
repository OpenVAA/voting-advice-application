import { BatchCondensationConfig } from "../evaluation/types/performanceEvalConfig";
import { CondensationOperations } from "../core/types/condensation/operation";
import { CONDENSATION_TYPE } from "../core/types/condensationType";

const currentEvalConfig: BatchCondensationConfig = {
  batchRunId: "batch-run-id-005",
  testCases: [],
  plan: {
    outputType: CONDENSATION_TYPE.LIKERT.PROS,
    steps: [
      {
        operation: CondensationOperations.MAP,
        params: {
          batchSize: 15,
          condensationPrompt: 'You are analyzing a batch of comments from a Voting Advice Application (VAA) to extract supporting arguments for a policy position.\n\nTopic: {{topic}}\n\nComments to analyze:\n{{comments}}\n\nPlease extract {{nOutputArgs}} clear, distinct supporting arguments from these comments. Each argument should:\n- Be specific and actionable\n- Represent a different aspect or perspective\n- Be written in clear, concise language\n- Focus on the benefits or positive aspects of the policy\n\nReturn your response as a JSON object with the following structure:\n{\n  "arguments": [\n    {\n      "id": "map_pro_arg_1",\n      "text": "Supporting argument from this batch"\n    },\n    {\n      "id": "map_pro_arg_2", \n      "text": "Another supporting argument from this batch"\n    }\n  ],\n  "reasoning": "Brief explanation of how you extracted these arguments from this batch"\n}'
        }
      },
      {
        operation: CondensationOperations.REDUCE,
        params: {
          denominator: 3,
          coalescingPrompt: 'You are coalescing multiple lists of supporting arguments for a policy position into a single, comprehensive list.\n\nTopic: {{topic}}\n\nArgument lists to coalesce:\n{{argumentLists}}\n\nPlease create a final list of {{nOutputArgs}} supporting arguments by:\n- Combining similar arguments from different lists\n- Removing duplicates and redundancies\n- Selecting the strongest and most representative arguments\n- Ensuring diversity of perspectives and aspects\n- Maintaining clarity and specificity\n\nReturn your response as a JSON object with the following structure:\n{\n  "arguments": [\n    {\n      "id": "final_pro_arg_1",\n      "text": "Final supporting argument"\n    },\n    {\n      "id": "final_pro_arg_2", \n      "text": "Another final supporting argument"\n    }\n  ],\n  "reasoning": "Brief explanation of how you coalesced the argument lists"\n}'
        }
      },
      {
        operation: CondensationOperations.GROUND,
        params: {
          batchSize: 10,
          groundingPrompt: 'You are grounding a list of supporting arguments for a policy position by refining them based on the original comments that inspired them.\n\nTopic: {{topic}}\n\nArguments to ground:\n{{arguments}}\n\nOriginal comments for context:\n{{comments}}\n\nPlease refine these arguments by:\n- Ensuring they accurately reflect the sentiments expressed in the original comments\n- Adding specific details or examples mentioned in the comments\n- Adjusting language to better match the tone and style of the original comments\n- Maintaining the supporting (pro) perspective while being grounded in the actual comment content\n\nReturn your response as a JSON object with the following structure:\n{\n  "arguments": [\n    {\n      "id": "grounded_pro_arg_1",\n      "text": "Grounded supporting argument"\n    },\n    {\n      "id": "grounded_pro_arg_2", \n      "text": "Another grounded supporting argument"\n    }\n  ],\n  "reasoning": "Brief explanation of how you grounded the arguments in the original comments"\n}'
        }
      }
    ],
    nOutputArgs: 10,
    language: "en"
  },
  promptIds: {
    refine: {
      initial: 'MOCK_REFINE_INITIAL_ID',
      refining: 'MOCK_REFINE_REFINING_ID'
    },
    map: 'MOCK_MAP_ID',
    reduce: 'MOCK_REDUCE_ID',
    ground: 'MOCK_GROUND_ID'
  }
};

export default currentEvalConfig;