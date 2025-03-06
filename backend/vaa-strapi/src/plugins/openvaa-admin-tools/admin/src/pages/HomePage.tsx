import { Card } from '@strapi/design-system';
import { Flex } from '@strapi/design-system';
import { Main, Typography } from '@strapi/design-system';
import { Accordion } from '@strapi/design-system';
import { Box } from '@strapi/design-system';
import { DeleteData } from '../components/DeleteData';
import { FindData } from '../components/FindData';
import { ImportData } from '../components/ImportData';
import { SendEmail } from '../components/SendEmail';

export function HomePage() {
  return (
    <Main padding={10}>
      <Flex direction="column" gap={5} alignItems="stretch">
        <Typography variant="alpha">
          <h1>OpenVAA Admin Tools</h1>
        </Typography>
        <Card>
          <Accordion.Root size="M">
            <Accordion.Item value="import">
              <Accordion.Header>
                <Accordion.Trigger>
                  <h2>Import Data</h2>
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content>
                <Box padding={5}>
                  <ImportData />
                </Box>
              </Accordion.Content>
            </Accordion.Item>
            <Accordion.Item value="delete">
              <Accordion.Header>
                <Accordion.Trigger>
                  <h2>Delete Data</h2>
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content>
                <Box padding={5}>
                  <DeleteData />
                </Box>
              </Accordion.Content>
            </Accordion.Item>
            <Accordion.Item value="find">
              <Accordion.Header>
                <Accordion.Trigger>
                  <h2>Find Data</h2>
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content>
                <Box padding={5}>
                  <FindData />
                </Box>
              </Accordion.Content>
            </Accordion.Item>
            <Accordion.Item value="sendEmail">
              <Accordion.Header>
                <Accordion.Trigger>
                  <h2>Send Email to Candidates</h2>
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content>
                <Box padding={5}>
                  <SendEmail />
                </Box>
              </Accordion.Content>
            </Accordion.Item>
          </Accordion.Root>
        </Card>
      </Flex>
    </Main>
  );
}
