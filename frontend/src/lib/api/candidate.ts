import { get } from 'svelte/store';
import type { Question, Answer, Language, User, Photo } from '$lib/types/candidateAttributes';
import { candidateContext } from '$lib/utils/candidateStore';
import { constants } from '$lib/utils/constants';
import type {
  StrapiAnswerData,
  StrapiLanguageData,
  StrapiGenderData,
  StrapiResponse,
  StrapiQuestionData
} from './dataProvider/strapi';
import { parseQuestionCategory } from './dataProvider/strapi/utils';

function getUrl(path: string, search: Record<string, string> = {}) {
  const url = new URL(constants.PUBLIC_BACKEND_URL);
  url.pathname = path;
  url.search = new URLSearchParams(search).toString();

  return url.toString();
}

export const authenticate = (identifier: string, password: string): Promise<Response> => {
  return fetch(getUrl('api/auth/local'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ identifier, password })
  });
};

export const register = (registrationKey: string, password: string): Promise<Response> => {
  return fetch(getUrl('api/auth/candidate/register'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ registrationKey, password })
  });
};

export const requestForgotPasswordLink = (email: string): Promise<Response> => {
  return fetch(getUrl('api/auth/forgot-password'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email })
  });
};

export const resetPassword = (code: string, password: string): Promise<Response> => {
  return fetch(getUrl('api/auth/reset-password'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      code: code,
      password: password,
      // We leave it up to the UI to do the validation if the password confirmation is correct
      passwordConfirmation: password
    })
  });
};

export const checkRegistrationKey = (registrationKey: string): Promise<Response> => {
  return fetch(getUrl('api/auth/candidate/check'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ registrationKey })
  });
};

type UserData = User & { error: unknown };

/**
 * Get the current user's data, including candidate information
 */
export const me = async (): Promise<User | undefined> => {
  const res = await request(
    getUrl('api/users/me', {
      'populate[candidate][populate][nomination][populate][party]': 'true',
      'populate[candidate][populate][nomination][populate][constituency]': 'true',
      'populate[candidate][populate][nomination][populate][election]': 'true',
      'populate[candidate][populate][party]': 'true',
      'populate[candidate][populate][photo]': 'true',
      'populate[candidate][populate][gender]': 'true',
      'populate[candidate][populate][motherTongues]': 'true',
      'populate[candidate][populate][appLanguage]': 'true'
    })
  );

  if (!res?.ok) return;

  const data: UserData = await res.json();
  if (data?.error) return;

  return data;
};

export const updateBasicInfo = async (
  manifesto?: LocalizedString,
  birthday?: string,
  genderID?: number,
  photo?: Photo,
  unaffiliated?: boolean,
  motherTongues?: Array<Language>
) => {
  const user = get(candidateContext.userStore);
  const candidate = user?.candidate;

  if (!candidate) {
    throw new Error('user.candidate is undefined');
  }

  return await request(getUrl(`api/candidates/${candidate.id}`), {
    method: 'PUT',
    body: JSON.stringify({
      data: {
        manifesto,
        birthday,
        gender: genderID,
        unaffiliated,
        photo: photo?.id,
        motherTongues
      }
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  });
};

/**
 * Change the user's preferred language for the app.
 */
export const updateAppLanguage = async (language: Language) => {
  const user = get(candidateContext.userStore);
  const candidate = user?.candidate;

  if (!candidate) {
    throw new Error('user.candidate is undefined');
  }

  return await request(getUrl(`api/candidates/${candidate.id}`), {
    method: 'PUT',
    body: JSON.stringify({
      data: {
        appLanguage: language?.id
      }
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  });
};

/**
 * Change the user's password to a new one.
 */
export const changePassword = (currentPassword: string, password: string) => {
  return request(getUrl('api/auth/change-password'), {
    method: 'POST',
    body: JSON.stringify({
      currentPassword,
      password,
      passwordConfirmation: password
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  });
};

/**
 * Get questions that have a likert scale.
 */
export const getLikertQuestions = async (): Promise<Record<string, Question> | undefined> => {
  const res = await request(
    getUrl('api/questions', {
      'populate[questionType]': 'true',
      'populate[category]': 'true',
      'filters[questionType][name][$startsWith]': 'Likert'
    })
  );

  if (!res?.ok) throw Error(res?.statusText);

  const questionData: StrapiResponse<Array<StrapiQuestionData>> = await res.json();

  const questions: Record<string, Question> = {};

  questionData.data.forEach((question) => {
    const attr = question.attributes;
    const settings = attr.questionType?.data.attributes.settings;
    const props: Question = {
      id: `${question.id}`,
      text: attr.text,
      info: attr.info,
      shortName: attr.shortName,
      category: parseQuestionCategory(attr.category.data),
      type: settings.type
    };
    if ('values' in settings)
      props.values = settings.values.map(({ key, label }) => ({
        key,
        label
      }));

    questions[question.id] = props;
  });
  return questions;
};

/**
 * Add answer to a question for the logged in user.
 */
export const addAnswer = (
  questionId: string,
  answerKey: AnswerOption['key'],
  openAnswer?: LocalizedString
): Promise<Response | undefined> => {
  return request(getUrl('api/answers'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      data: {
        question: Number(questionId),
        value: answerKey,
        openAnswer
      }
    })
  });
};

/**
 * Update an existing answer for the logged in user.
 * The answer id is sufficient to identify the answer and question.
 */
export const updateAnswer = (
  answerId: string,
  answerKey: AnswerOption['key'],
  openAnswer?: LocalizedString
): Promise<Response | undefined> => {
  return request(getUrl(`api/answers/${answerId}`), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      data: {
        value: answerKey,
        openAnswer
      }
    })
  });
};

/**
 * Delete an existing answer for the logged in user.
 */
export const deleteAnswer = (answerId: string): Promise<Response | undefined> => {
  return request(getUrl(`api/answers/${answerId}`), {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    }
  });
};

/**
 * Get all the answers for the logged in user.
 */
export const getExistingAnswers = async (): Promise<Record<string, Answer> | undefined> => {
  const user = get(candidateContext.userStore)?.candidate;
  const candidateId = user?.id;

  if (!candidateId) return;

  const res = await request(
    getUrl('api/answers', {
      'populate[question][populate][category]': 'true',
      'filters[candidate][id][$eq]': candidateId.toString(),
      'filters[question][category][type][$eq]': 'opinion'
    })
  );

  if (!res?.ok) return;

  const answerData: StrapiResponse<Array<StrapiAnswerData>> = await res.json();

  // Parse the data into a more usable format where the question ID is the key
  const answers: Record<string, Answer> = {};

  answerData.data.forEach((answer) => {
    answers[answer.attributes.question.data.id] = {
      id: `${answer.id}`,
      key: answer.attributes.value as number,
      openAnswer: answer.attributes.openAnswer
    };
  });

  return answers;
};

export const getLanguages = async (): Promise<Array<StrapiLanguageData> | undefined> => {
  const res = await request(
    getUrl('api/languages', {
      'populate[language]': 'true'
    })
  );
  if (!res?.ok) return undefined;

  const resJson = await res.json();
  return resJson.data;
};

export const getGenders = async (): Promise<Array<StrapiGenderData> | undefined> => {
  const res = await request(getUrl('api/genders'));
  if (!res?.ok) return undefined;

  const resJson = await res.json();
  return resJson.data;
};

export const uploadFiles = (files: Array<File>) => {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  return request(getUrl('/api/upload/'), {
    method: 'POST',
    body: formData
  });
};

export const deleteFile = (id: number) => {
  return request(getUrl(`/api/upload/files/${id}`), { method: 'DELETE' });
};

export const request = async (url: string, options: RequestInit = {}) => {
  const token = candidateContext.tokenStore;

  // Allow providing headers, but with an enforced Authorization header
  if (!options.headers) options.headers = {};
  (options.headers as Record<string, string>)['Authorization'] = `Bearer ${get(token)}`;

  return await fetch(url, options).catch((error) => {
    console.error('Error in getting data from backend:', error);
    return undefined;
  });
};
