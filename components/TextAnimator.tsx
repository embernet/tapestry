import React, { useState, useEffect } from 'react';
import { TAGLINES } from '../constants';

export const TextAnimator = () => {
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [reverse, setReverse] = useState(false);

  // blink cursor
  useEffect(() => {
    if (index >= TAGLINES.length) {
        setIndex(0);
        return;
    }

    if (subIndex === TAGLINES[index].length + 1 && !reverse) {
      setTimeout(() => setReverse(true), 2000);
      return;
    }

    if (subIndex === 0 && reverse) {
      setReverse(false);
      setIndex((prev) => (prev + 1) % TAGLINES.length);
      return;
    }

    const timeout = setTimeout(() => {
      setSubIndex((prev) => prev + (reverse ? -1 : 1));
    }, reverse ? 30 : 60);

    return () => clearTimeout(timeout);
  }, [subIndex, index, reverse]);

  return (
    <span className="inline-block min-h-[1.5em]">
      {TAGLINES[index % TAGLINES.length].substring(0, subIndex)}
      <span className="animate-pulse border-r-2 border-blue-400 ml-1">&nbsp;</span>
    </span>
  );
};