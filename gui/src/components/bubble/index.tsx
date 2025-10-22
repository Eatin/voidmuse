import Bubble from '@ant-design/x/lib/bubble/Bubble';
import List from './BubbleList';

export type { BubbleProps } from '@ant-design/x/lib/bubble/interface';

type BubbleType = typeof Bubble & {
  List: typeof List;
};

(Bubble as BubbleType).List = List;

export default Bubble as BubbleType;
