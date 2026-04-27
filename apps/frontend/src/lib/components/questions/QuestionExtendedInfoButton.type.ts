import type { AnyQuestionVariant } from '@openvaa/data';
import type { ButtonProps } from '$lib/components/button';
import type { QuestionExtendedInfoProps } from './QuestionExtendedInfo.type';

export type QuestionExtendedInfoButtonProps = Partial<ButtonProps> &
  Pick<QuestionExtendedInfoProps, 'onSectionCollapse' | 'onSectionExpand'> & {
    /**
     * The question to extract info from
     */
    question: AnyQuestionVariant;
    /**
     * A callback function to be executed when the drawer is opened, mostly for tracking.
     */
    onOpen?: () => void;
  };
