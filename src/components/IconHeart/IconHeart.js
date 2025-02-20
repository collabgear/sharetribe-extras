import React from 'react';
import { oneOf, string } from 'prop-types';
import classNames from 'classnames';

import css from './IconHeart.module.css';

export const SIZE_BIG = 'big';
export const SIZE_SMALL = 'small';

export const FILL_TYPE_EMPTY = 'empty';
export const FILL_TYPE_FULL = 'filled';

const IconHeart = props => {
  const { className, rootClassName, fillType, size } = props;
  const classes = classNames(
    rootClassName || ( fillType === FILL_TYPE_FULL ? css.rootFull : css.rootEmpty ),
    className
  );

  const isBig = size === SIZE_BIG;

  return (
    <svg
      className={classes}
      width={ isBig ? "50" : "30"}
      height={ isBig ? "50" : "30"}
      viewBox={"0 0 24 24"}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 5.881C12.981 4.729 14.484 4 16.05 4C18.822 4 21 6.178 21 8.95C21 12.3492
                 17.945 15.1195 13.3164 19.3167L13.305 19.327L12 20.515L10.695 19.336L10.6595
                 19.3037C6.04437 15.1098 3 12.3433 3 8.95C3 6.178 5.178 4 7.95 4C9.516 4 11.019 4.729 12 5.881Z"/>
    </svg>
  );
};

IconHeart.defaultProps = {
  className: null,
  rootClassName: null,
  size: SIZE_SMALL,
  fillType: FILL_TYPE_EMPTY,
};

IconHeart.propTypes = {
  className: string,
  rootClassName: string,
  size: oneOf([SIZE_BIG, SIZE_SMALL]),
  fillType: oneOf([ FILL_TYPE_EMPTY, FILL_TYPE_FULL ]),
};

export default IconHeart;
