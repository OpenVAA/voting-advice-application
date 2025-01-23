import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

export async function POST(event: RequestEvent) {
  console.info('Generate arguments endpoint called');
  try {
    const { questionId, opinions } = await event.request.json();
    console.info('Received request data:', { questionId, opinions });

    // Return mock data in the infoSections format
    return json({
      infoSections: {
        argumentsFor: {
          text: {
            en: '• Mock argument for point 1\n• Mock argument for point 2',
            fi: '• Mock argument for point 1 in Finnish\n• Mock argument for point 2 in Finnish',
            sv: '• Mock argument for point 1 in Swedish\n• Mock argument for point 2 in Swedish'
          },
          title: {
            en: 'Arguments For',
            fi: 'Argumentit puolesta',
            sv: 'Argument för'
          },
          visible: true
        },
        argumentsAgainst: {
          text: {
            en: '• Mock argument against point 1\n• Mock argument against point 2',
            fi: '• Mock argument against point 1 in Finnish\n• Mock argument against point 2 in Finnish',
            sv: '• Mock argument against point 1 in Swedish\n• Mock argument against point 2 in Swedish'
          },
          title: {
            en: 'Arguments Against',
            fi: 'Argumentit vastaan',
            sv: 'Argument emot'
          },
          visible: true
        }
      }
    });
  } catch (error) {
    console.error('Failed to generate arguments:', error);
    return json({ error: 'Failed to generate arguments' }, { status: 500 });
  }
}
