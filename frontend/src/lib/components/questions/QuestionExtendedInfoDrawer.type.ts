import type { AnyQuestionVariant } from '@openvaa/data';
import type { DrawerProps } from '../modal/drawer';
import type { QuestionExtendedInfoProps } from './QuestionExtendedInfo.type';

export type QuestionExtendedInfoDrawerProps = Omit<DrawerProps, 'title'> &
  Pick<QuestionExtendedInfoProps, 'onSectionCollapse' | 'onSectionExpand'> & {
    /**
     * The question to extract info from
     */
    question: AnyQuestionVariant;
  };
