import { Card } from '@strapi/design-system';
import { Flex } from '@strapi/design-system';
import { Main, Typography } from '@strapi/design-system';
import { DeleteData } from '../components/DeleteData';
import { ImportData } from '../components/ImportData';

export function HomePage() {
  return (
    <Main padding={10}>
      <Flex direction="column" gap={5} alignItems="stretch">
        <Typography variant="alpha">
          <h1>OpenVAA Admin Tools</h1>
        </Typography>
        <Card padding={5}>
          <ImportData />
        </Card>
        <Card padding={5}>
          <DeleteData />
        </Card>
      </Flex>
    </Main>
  );
}
