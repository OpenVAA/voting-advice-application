import { Button, Field } from '@strapi/design-system';
import { Flex } from '@strapi/design-system';
import { JSONInput } from '@strapi/design-system';
import { Typography } from '@strapi/design-system';
import { CheckCircle, Upload, WarningCircle } from '@strapi/icons';
import { FormEvent, ReactElement, useState } from 'react';
import { ApiResult } from 'src/api/utils/apiResult.type';

/**
 * A base component for handling posting JSON data to the `/openvaa-admin-tools/data-{foo}` endpoints.
 */
export function DataBase({
  title,
  intro,
  submitLabel,
  submitHandler,
}: {
  title: string;
  intro: ReactElement;
  submitLabel: string;
  submitHandler: (data: object) => Promise<ApiResult>;
}): ReactElement {
  const [info, setInfo] = useState('');
  const [status, setStatus] = useState('idle');
  const [data, setData] = useState('');

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    let parsedData: object;
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
      setInfo(result.cause || result.message || 'There was an error comleting the action.');
      return;
    }
    setStatus('success');
    setInfo(result.message || 'Action succesfully completed.');
  }

  return (
    <form onSubmit={handleSubmit}>
      <Flex direction="column" gap={5} alignItems="stretch">
        <Typography variant="beta">
          <h2>{title}</h2>
        </Typography>
        <Typography variant="epsilon">{intro}</Typography>
        <Field.Root>
          <Field.Label>Data as JSON</Field.Label>
          <JSONInput value={''} height="30rem" onChange={setData} />
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
