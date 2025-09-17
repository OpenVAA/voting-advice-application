import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { getElectionData } from './tools/get-data';

const GetDataParams: any = {
  electionId: z.string()
};

const server = new McpServer(
  {
    name: 'openvaa-data-server',
    version: '1.0.0',
    description: 'OpenVAA data server'
  },
  {
    capabilities: {
      resources: {},
      tools: {}
    }
  }
);

// TODO: add resources to the data server we make later
//  also  a clear distinction between tools and resources
server.tool('getData', 'Get data from the OpenVAA data server', GetDataParams, async (request: any) => {
  const { electionId } = request.params || {};

  if (!electionId) {
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify('No electionId provided', null, 2)
        }
      ]
    } as any;
  }

  const data = await getElectionData(electionId);
  if (!data) {
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify('No data found', null, 2)
        }
      ]
    } as any;
  }

  return {
    content: [
      {
        type: 'text' as const,
        text: 'Data: ' + JSON.stringify(data, null, 2)
      }
    ]
  } as any;
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('Failed to start server in main():', error);
  process.exit(1);
});
