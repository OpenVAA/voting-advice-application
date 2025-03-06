import { Button, Field, Flex, JSONInput, Typography } from '@strapi/design-system';
import { CheckCircle, Upload, WarningCircle } from '@strapi/icons';
import { FormEvent, ReactElement, useState } from 'react';
import { ApiResult } from 'src/api/utils/apiResult.type';

/**
 * A base component for handling posting JSON data to the `/openvaa-admin-tools/data-{foo}` endpoints.
 */
export function DataBase({
  intro,
  submitLabel,
  submitHandler,
}: {
  intro: ReactElement;
  submitLabel: string;
  submitHandler: (data: Record<string, unknown>) => Promise<ApiResult>;
}): ReactElement {
  const [info, setInfo] = useState('');
  const [status, setStatus] = useState('idle');
  const [data, setData] = useState('');
  const [result, setResult] = useState('');

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    let parsedData: Record<string, unknown>;
    try {
      parsedData = JSON.parse(data);
    } catch (error) {
      setStatus('warning');
      setInfo(`The JSON provided is invalid: ${error instanceof Error ? error.message : '—'}`);
      return;
    }
    const result = await submitHandler(parsedData);
    if (result.type !== 'success') {
      setStatus('warning');
      setInfo(result.cause || 'There was an error completing the action.');
      return;
    }
    setStatus('success');
    setInfo('Action succesfully completed.');
    setResult(JSON.stringify(result.data ?? {}, null, 2));
  }

  return (
    <form onSubmit={handleSubmit}>
      <Flex direction="column" gap={5} alignItems="stretch">
        <Typography variant="epsilon">{intro}</Typography>
        <Field.Root>
          <Field.Label>Data as JSON</Field.Label>
          <JSONInput value={''} height="20rem" maxWidth="80vw" onChange={setData} />
        </Field.Root>
        <Field.Root>
          <Field.Label>Result as JSON</Field.Label>
          <JSONInput value={result} height="20rem" maxWidth="80vw" />
        </Field.Root>
        {status !== 'idle' && (
          <Typography variant="epsilon">
            <p style={{ margin: '1rem 0' }}>
              {status === 'success' ? (
                <CheckCircle fill="success700" />
              ) : status === 'warning' ? (
                <WarningCircle fill="warning700" />
              ) : null}
              {info}
            </p>
          </Typography>
        )}
        <Button type="submit" startIcon={<Upload />}>
          {submitLabel}
        </Button>
      </Flex>
    </form>
  );
}
